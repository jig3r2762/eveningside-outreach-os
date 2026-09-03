import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { logAiUsage } from "@/lib/ai-governance";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { companyId, leadId } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Mock AI Web Scraping and Analysis
    // In production, this would use tools like Firecrawl + OpenAI structured outputs

    const mockDossier = {
      companyOverview: `${company.name} is a leading player in the ${company.industry || "manufacturing"} space. Recently expanded operations in the Midwest.`,
      manufacturingProcess: "Utilizes legacy batch manufacturing processes with emerging signs of continuous integration on newer product lines.",
      workflowBottlenecks: "Heavy reliance on paper-based quality assurance (QA) and manual data entry between production floor and ERP.",
      erpSignals: "Currently using an older version of Epicor. Recent job postings indicate a migration or upgrade might be in discussion.",
      automationSignals: "Hiring 'Automation Engineers' and 'PLC Programmers', indicating an active push towards shop floor automation.",
      technologyStack: "Epicor ERP, Microsoft 365, older SCADA systems, custom legacy AS400 applications.",
      decisionMakers: "VP of Operations (Sarah Jenkins), IT Director (Mike Roberts), Plant Manager (David Chen).",
      recommendedService: "Digital Transformation & ERP Integration",
      pitchAngle: "Highlight how integrating their shop floor PLCs directly into Epicor can eliminate their manual QA data entry, saving 15 hours per week per line.",
      confidence: "HIGH"
    };

    // Save Research to DB
    const research = await prisma.research.create({
      data: {
        companyId,
        leadId,
        ...mockDossier
      }
    });

    // Create some evidence claims
    await prisma.researchClaim.createMany({
      data: [
        {
          researchId: research.id,
          claim: "Hiring Automation Engineers",
          source: "LinkedIn Jobs",
          category: "VERIFIED_FACT",
          confidence: "HIGH"
        },
        {
          researchId: research.id,
          claim: "Manual QA processes",
          source: "Employee Glassdoor Review",
          category: "EVIDENCE_BASED_INFERENCE",
          confidence: "MEDIUM"
        }
      ]
    });

    // Log AI Usage
    await logAiUsage({
      featureName: "RESEARCH_DOSSIER",
      inputTokens: 2500, // crawling website + linkedin
      outputTokens: 850,
      cost: 0.015,
      confidence: 0.92,
      companyId,
      leadId
    });

    return NextResponse.json({ success: true, data: research });
  } catch (error) {
    console.error("Failed to generate research dossier:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
