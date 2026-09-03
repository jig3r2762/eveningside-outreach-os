import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const totalContacts = await prisma.contact.count();
    const missingEmails = await prisma.contact.count({
      where: { OR: [{ email: null }, { email: "" }] },
    });
    const unverifiedContacts = await prisma.contact.count({
      where: { verificationStatus: "UNVERIFIED" },
    });
    const missingTitles = await prisma.contact.count({
      where: { OR: [{ jobTitle: null }, { jobTitle: "" }] },
    });

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const staleLeads = await prisma.lead.count({
      where: {
        lastContactDate: { lt: twoWeeksAgo },
        stage: { notIn: ["WON", "LOST", "NURTURE"] },
      },
    });

    // Calculate dynamic health score
    let healthScore = 100;
    if (totalContacts > 0) {
      const emailRatio = (totalContacts - missingEmails) / totalContacts;
      const titleRatio = (totalContacts - missingTitles) / totalContacts;
      healthScore = Math.round(emailRatio * 50 + titleRatio * 30 + (staleLeads === 0 ? 20 : Math.max(0, 20 - staleLeads * 2)));
    }

    const issues = [
      {
        type: "MISSING_EMAIL",
        count: missingEmails,
        severity: "HIGH",
        description: "Contacts missing business email addresses",
      },
      {
        type: "UNVERIFIED_CONTACT",
        count: unverifiedContacts,
        severity: "MEDIUM",
        description: "Contacts with unverified email or phone information",
      },
      {
        type: "MISSING_TITLE",
        count: missingTitles,
        severity: "LOW",
        description: "Contacts without designated job title or role",
      },
      {
        type: "STALE_LEAD",
        count: staleLeads,
        severity: "HIGH",
        description: "Active leads with zero contact in over 14 days",
      },
    ];

    return NextResponse.json({
      healthScore,
      totalContacts,
      issues,
      scannedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
