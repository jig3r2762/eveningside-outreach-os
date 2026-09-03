import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { processAutomation } from "@/lib/automation/rules-engine";
import { calculateQualification } from "@/lib/qualification";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  const leadId = searchParams.get("leadId");

  try {
    const researchList = await prisma.research.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(leadId ? { leadId } : {}),
      },
      include: {
        claims: true,
        company: { select: { id: true, name: true, industry: true, website: true } },
        lead: { select: { id: true, stage: true, leadScore: true } },
        researcher: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(researchList);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      companyId,
      leadId,
      companyOverview,
      products,
      manufacturingProcess,
      locations,
      operationalComplexity,
      erpSignals,
      automationSignals,
      hiringSignals,
      expansionSignals,
      digitalTransformationSignals,
      buyingSignals,
      workflowBottlenecks,
      technologyStack,
      relevantNews,
      confidence = "MEDIUM",
      claims = [],
    } = body;

    if (!companyId) {
      return NextResponse.json({ error: "companyId is required" }, { status: 400 });
    }

    const research = await prisma.research.create({
      data: {
        companyId,
        leadId,
        companyOverview,
        products,
        manufacturingProcess,
        locations,
        operationalComplexity,
        erpSignals,
        automationSignals,
        hiringSignals,
        expansionSignals,
        digitalTransformationSignals,
        buyingSignals,
        workflowBottlenecks,
        technologyStack,
        relevantNews,
        confidence,
        researcherId: session.user.id,
        claims: {
          create: claims.map((c: any) => ({
            claim: c.claim,
            source: c.source || "Research",
            sourceUrl: c.sourceUrl || null,
            confidence: c.confidence || "MEDIUM",
            category: c.category || "UNKNOWN",
          })),
        },
      },
      include: { claims: true },
    });

    // If there is an associated lead, trigger qualification recalculation and automation
    let targetLeadId = leadId;
    if (!targetLeadId) {
      const existingLead = await prisma.lead.findFirst({
        where: { companyId },
        select: { id: true },
      });
      if (existingLead) targetLeadId = existingLead.id;
    }

    if (targetLeadId) {
      await calculateQualification({ leadId: targetLeadId, companyId });
      await processAutomation("RESEARCH_COMPLETED", {
        leadId: targetLeadId,
        companyId,
        userId: session.user.id,
      });
    }

    return NextResponse.json(research, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create research:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
