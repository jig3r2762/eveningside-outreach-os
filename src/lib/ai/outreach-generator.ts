/**
 * AI Outreach Message Generator
 * Uses company info, contact info, research, and conversation history
 * to generate personalized outreach messages.
 */

import { generateCompletion } from "./openai-client";
import { SYSTEM_PROMPT_OUTREACH, SYSTEM_PROMPT_RESEARCH, buildOutreachPrompt, buildResearchSummaryPrompt } from "./prompts";
import prisma from "../db";

export interface OutreachMessages {
  connectionRequest: string;
  firstMessage: string;
  followUp1: string;
  followUp2: string;
  email: {
    subject: string;
    body: string;
  };
  callOpening: string;
  discoveryQuestions: string[];
}

/**
 * Generate outreach messages for a lead
 */
export async function generateOutreachMessages(
  leadId: string
): Promise<OutreachMessages | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      company: true,
      primaryContact: true,
      research: {
        include: { claims: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      activities: {
        orderBy: { date: "desc" },
        take: 5,
      },
    },
  });

  if (!lead) return null;

  const research = lead.research[0];

  // Build context from previous conversations
  const previousConversation = lead.activities
    .filter((a) => a.message)
    .map((a) => `[${a.activityType}] ${a.message}`)
    .join("\n");

  const prompt = buildOutreachPrompt({
    companyName: lead.company.name,
    contactName: lead.primaryContact?.fullName || "Contact",
    contactTitle: lead.primaryContact?.jobTitle || undefined,
    industry: lead.company.industry || undefined,
    productsServices: lead.company.productsServices || undefined,
    country: lead.company.country || undefined,
    researchNotes: research?.companyOverview || lead.company.researchNotes || undefined,
    operationalComplexity: research?.operationalComplexity || undefined,
    painPoints: lead.potentialPainPoints || research?.workflowBottlenecks || undefined,
    previousConversation: previousConversation || undefined,
  });

  const result = await generateCompletion(SYSTEM_PROMPT_OUTREACH, prompt, {
    temperature: 0.7,
  });

  if (!result) return null;

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as OutreachMessages;
  } catch {
    console.error("Failed to parse outreach messages:", result);
    return null;
  }
}

/**
 * Generate research summary for a company
 */
export async function generateResearchSummary(
  companyId: string,
  researchId?: string
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      research: {
        where: researchId ? { id: researchId } : {},
        include: { claims: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!company) return null;

  const research = company.research[0];
  if (!research) return null;

  const prompt = buildResearchSummaryPrompt({
    companyName: company.name,
    website: company.website || undefined,
    industry: company.industry || undefined,
    productsServices: company.productsServices || undefined,
    researchFields: {
      "Company Overview": research.companyOverview,
      "Products": research.products,
      "Manufacturing Process": research.manufacturingProcess,
      "Locations": research.locations,
      "Operational Complexity": research.operationalComplexity,
      "ERP Signals": research.erpSignals,
      "Automation Signals": research.automationSignals,
      "Hiring Signals": research.hiringSignals,
      "Expansion Signals": research.expansionSignals,
      "Digital Transformation": research.digitalTransformationSignals,
      "Buying Signals": research.buyingSignals,
      "Workflow Bottlenecks": research.workflowBottlenecks,
      "Technology Stack": research.technologyStack,
      "Relevant News": research.relevantNews,
    },
  });

  const result = await generateCompletion(SYSTEM_PROMPT_RESEARCH, prompt, {
    temperature: 0.5,
  });

  if (!result) return null;

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse research summary:", result);
    return null;
  }
}

/**
 * Fallback outreach templates when AI is not available
 */
export function getFallbackOutreach(data: {
  companyName: string;
  contactName: string;
  contactTitle?: string;
  industry?: string;
}): OutreachMessages {
  const firstName = data.contactName.split(" ")[0];

  return {
    connectionRequest: `Hi ${firstName}, I work with ${data.industry || "companies"} on operations and automation. Would like to connect.`,
    firstMessage: `Hi ${firstName}, thanks for connecting. I noticed ${data.companyName} operates in ${data.industry || "your space"}. Curious how you currently manage your operational workflows — is that something you're looking to improve?`,
    followUp1: `Hi ${firstName}, wanted to follow up on my previous message. Would love to learn more about ${data.companyName}'s operations.`,
    followUp2: `Hi ${firstName}, one last note — if streamlining operations at ${data.companyName} is on your radar, I'd be happy to share how we've helped similar companies. No pressure either way.`,
    email: {
      subject: `Quick question about ${data.companyName}'s operations`,
      body: `Hi ${firstName},\n\nI noticed ${data.companyName} and thought there might be some relevance to what we do at Evening Side Labs.\n\nWe help ${data.industry || "companies"} automate and streamline their operational workflows. Curious if that's something you're exploring?\n\nHappy to share a few examples if helpful.\n\nBest,\nJigar\nEvening Side Labs`,
    },
    callOpening: `Hi ${firstName}, this is Jigar from Evening Side Labs. I noticed ${data.companyName} and wanted to ask a quick question about how you currently handle your operational workflows.`,
    discoveryQuestions: [
      `What does your current workflow look like for [core process]?`,
      `What systems are you using to manage operations today?`,
      `What's the biggest bottleneck in your current process?`,
      `Have you explored automation for any of these workflows?`,
      `If you could fix one operational pain point, what would it be?`,
    ],
  };
}
