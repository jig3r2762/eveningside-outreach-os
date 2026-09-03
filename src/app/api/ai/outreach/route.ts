import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateOutreachMessages, getFallbackOutreach } from "@/lib/ai/outreach-generator";
import { generateResearchSummary } from "@/lib/ai/outreach-generator";
import { isAIAvailable } from "@/lib/ai/openai-client";
import prisma from "@/lib/db";

/**
 * POST /api/ai/outreach — Generate outreach messages for a lead
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { leadId } = body;

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      company: true,
      primaryContact: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Try AI generation first, fallback to templates
  if (isAIAvailable()) {
    const messages = await generateOutreachMessages(leadId);
    if (messages) {
      return NextResponse.json({ messages, source: "ai" });
    }
  }

  // Fallback to template-based generation
  const messages = getFallbackOutreach({
    companyName: lead.company.name,
    contactName: lead.primaryContact?.fullName || "Contact",
    contactTitle: lead.primaryContact?.jobTitle || undefined,
    industry: lead.company.industry || undefined,
  });

  return NextResponse.json({ messages, source: "template" });
}
