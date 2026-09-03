import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const recommendations = [];

    // 1. Overdue follow-ups (HIGH)
    const overdueFollowUps = await db.followUp.findMany({
      where: { dueDate: { lt: startOfToday }, status: "PENDING" },
      include: { lead: { include: { company: true } }, contact: true },
      take: 2,
    });

    for (const f of overdueFollowUps) {
      if (f.lead && f.contact) {
        recommendations.push({
          priority: "HIGH",
          action: `Complete overdue follow-up via ${f.channel || 'any channel'}`,
          reason: `This follow-up was due on ${f.dueDate.toLocaleDateString()}. Don't let this lead go cold.`,
          leadId: f.lead.id,
          contactName: f.contact.fullName,
          companyName: f.lead.company.name,
        });
      }
    }

    // 2. Follow-ups due today (HIGH/MEDIUM)
    const dueToday = await db.followUp.findMany({
      where: { dueDate: { gte: startOfToday, lte: endOfToday }, status: "PENDING" },
      include: { lead: { include: { company: true } }, contact: true },
      take: 2,
    });

    for (const f of dueToday) {
      if (f.lead && f.contact) {
        recommendations.push({
          priority: f.priority === "HIGH" ? "HIGH" : "MEDIUM",
          action: `Reach out today via ${f.channel || 'any channel'}`,
          reason: "Scheduled follow-up for today.",
          leadId: f.lead.id,
          contactName: f.contact.fullName,
          companyName: f.lead.company.name,
        });
      }
    }

    // 3. Qualified leads with no outreach (MEDIUM)
    const qualifiedNoOutreach = await db.lead.findMany({
      where: { 
        stage: "QUALIFIED", 
        activities: { none: {} } 
      },
      include: { company: true, primaryContact: true },
      take: 2,
    });

    for (const l of qualifiedNoOutreach) {
      if (l.primaryContact) {
        recommendations.push({
          priority: "MEDIUM",
          action: "Initiate first contact",
          reason: "This lead is qualified but hasn't received any outreach yet.",
          leadId: l.id,
          contactName: l.primaryContact.fullName,
          companyName: l.company.name,
        });
      }
    }

    // 4. Leads with recent replies needing response (HIGH)
    // Find recent INBOUND activities where no subsequent OUTBOUND activity exists
    const recentInbound = await db.activity.findMany({
      where: {
        direction: "INBOUND",
        date: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      },
      include: { lead: { include: { company: true, primaryContact: true } } },
      orderBy: { date: 'desc' },
      take: 5
    });
    
    // Simplification for the demo: just grab the first one that has a lead
    for (const act of recentInbound) {
      if (act.lead && act.lead.primaryContact && recommendations.length < 5) {
        // avoid duplicates
        if (!recommendations.some(r => r.leadId === act.leadId)) {
          recommendations.push({
            priority: "HIGH",
            action: `Respond to recent ${act.channel} reply`,
            reason: "They recently replied and are waiting for your response.",
            leadId: act.lead.id,
            contactName: act.lead.primaryContact.fullName,
            companyName: act.lead.company.name,
          });
        }
      }
    }

    // 5. High-score leads in early stages (LOW)
    if (recommendations.length < 5) {
      const highScoring = await db.lead.findMany({
        where: { leadScore: { gte: 70 }, stage: { in: ["NEW", "RESEARCHING"] } },
        include: { company: true, primaryContact: true },
        take: 2,
      });

      for (const l of highScoring) {
        if (l.primaryContact && recommendations.length < 5 && !recommendations.some(r => r.leadId === l.id)) {
          recommendations.push({
            priority: "LOW",
            action: "Accelerate qualification",
            reason: `High lead score (${l.leadScore}) indicates strong potential fit.`,
            leadId: l.id,
            contactName: l.primaryContact.fullName,
            companyName: l.company.name,
          });
        }
      }
    }

    // Sort by priority HIGH > MEDIUM > LOW
    const priorityMap: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    recommendations.sort((a, b) => (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0));

    return NextResponse.json(recommendations.slice(0, 5));
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
