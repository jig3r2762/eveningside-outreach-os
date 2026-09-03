/**
 * AI Prompt Templates
 * All prompts for the AI assistant features.
 * Distinguishes between verified facts, evidence-based inferences, hypotheses, and unknowns.
 */

export const SYSTEM_PROMPT_OUTREACH = `You are an AI assistant for Evening Side Labs, a technical consulting and AI automation company.
Your job is to help craft personalized, concise B2B outreach messages for manufacturing, operations, and technology companies.

Evening Side Labs offers:
- Custom Software Development
- AI Automation
- Workflow Automation
- ERP / Operations Systems
- Internal Business Platforms
- AI Agents
- Data & Analytics
- API Integration
- Mobile & Web Applications
- Model Fine-tuning

RULES:
1. Messages must be SHORT and personalized. No generic "We are an AI company" or "We help businesses transform" language.
2. Use patterns like:
   - "I noticed X about your company..."
   - "Curious how you currently handle Y?"
   - "Given X, I thought there might be some relevance..."
3. Reference specific details about the company when available.
4. Never fabricate facts about the company or person.
5. LinkedIn connection requests must be under 300 characters.
6. First messages should be 2-3 sentences max.
7. Follow-ups should be even shorter.
8. Discovery questions should be genuinely curious, not salesy.
9. If you don't know something about the company, don't pretend you do.`;

export const SYSTEM_PROMPT_RESEARCH = `You are a research assistant for Evening Side Labs.
Your job is to analyze available information about companies and identify potential operational challenges.

RULES:
1. Clearly distinguish between:
   - VERIFIED FACT: Information directly from a reliable source
   - EVIDENCE-BASED INFERENCE: Logical conclusion from available evidence
   - HYPOTHESIS: Reasonable guess based on industry patterns
   - UNKNOWN: Information you don't have

2. Never present an inference or hypothesis as a verified fact.
3. Focus on identifying:
   - Operational complexity
   - Workflow bottlenecks
   - Technology gaps
   - Growth challenges
   - Automation opportunities
4. Be specific about what evidence supports each claim.`;

export const SYSTEM_PROMPT_SCORING = `You are a lead qualification assistant for Evening Side Labs.
Analyze the provided information and suggest qualification scores.

Score categories (out of max shown):
- Company Fit (0-20): How well does this company match ESL's ideal client profile?
- Operational Complexity (0-20): How complex are their operations?
- Potential Pain (0-20): How likely are they to have problems ESL can solve?
- Buying Signal (0-15): Any signals they might be ready to buy?
- Decision-Maker Access (0-15): Do we have access to the right people?
- Contact Quality (0-10): How good is our contact information?

Provide reasoning for each score.`;

/**
 * Build outreach generation prompt from lead data
 */
export function buildOutreachPrompt(data: {
  companyName: string;
  contactName: string;
  contactTitle?: string;
  industry?: string;
  productsServices?: string;
  country?: string;
  researchNotes?: string;
  operationalComplexity?: string;
  painPoints?: string;
  previousConversation?: string;
}): string {
  let prompt = `Generate personalized outreach messages for the following lead:

COMPANY: ${data.companyName}
CONTACT: ${data.contactName}`;

  if (data.contactTitle) prompt += `\nTITLE: ${data.contactTitle}`;
  if (data.industry) prompt += `\nINDUSTRY: ${data.industry}`;
  if (data.productsServices) prompt += `\nPRODUCTS/SERVICES: ${data.productsServices}`;
  if (data.country) prompt += `\nCOUNTRY: ${data.country}`;
  if (data.researchNotes) prompt += `\nRESEARCH NOTES: ${data.researchNotes}`;
  if (data.operationalComplexity) prompt += `\nOPERATIONAL COMPLEXITY: ${data.operationalComplexity}`;
  if (data.painPoints) prompt += `\nPOTENTIAL PAIN POINTS: ${data.painPoints}`;
  if (data.previousConversation) prompt += `\nPREVIOUS CONVERSATION: ${data.previousConversation}`;

  prompt += `

Generate the following in JSON format:
{
  "connectionRequest": "LinkedIn connection request (under 300 chars)",
  "firstMessage": "First LinkedIn message (2-3 sentences)",
  "followUp1": "First follow-up message (1-2 sentences)",
  "followUp2": "Second follow-up message (1-2 sentences)",
  "email": {
    "subject": "Email subject line",
    "body": "Email body (3-4 sentences)"
  },
  "callOpening": "Phone call opening (1-2 sentences)",
  "discoveryQuestions": ["question1", "question2", "question3", "question4", "question5"]
}

Remember: Be specific, personal, and genuinely curious. No generic sales language.`;

  return prompt;
}

/**
 * Build research summary prompt
 */
export function buildResearchSummaryPrompt(data: {
  companyName: string;
  website?: string;
  industry?: string;
  productsServices?: string;
  researchFields: Record<string, string | null>;
}): string {
  let prompt = `Summarize the research findings for ${data.companyName} and identify potential operational challenges.

COMPANY: ${data.companyName}`;

  if (data.website) prompt += `\nWEBSITE: ${data.website}`;
  if (data.industry) prompt += `\nINDUSTRY: ${data.industry}`;
  if (data.productsServices) prompt += `\nPRODUCTS/SERVICES: ${data.productsServices}`;

  prompt += `\n\nRESEARCH DATA:`;
  for (const [key, value] of Object.entries(data.researchFields)) {
    if (value) {
      prompt += `\n${key}: ${value}`;
    }
  }

  prompt += `

Provide a structured summary in JSON format:
{
  "summary": "2-3 sentence overview",
  "operationalChallenges": [
    { "challenge": "description", "confidence": "HIGH|MEDIUM|LOW", "category": "VERIFIED_FACT|EVIDENCE_BASED_INFERENCE|HYPOTHESIS" }
  ],
  "automationOpportunities": [
    { "opportunity": "description", "confidence": "HIGH|MEDIUM|LOW" }
  ],
  "recommendedServices": ["service1", "service2"],
  "keyQuestions": ["question1", "question2"],
  "missingInformation": ["what we need to find out"]
}

Remember: Clearly label each finding's confidence level and category.`;

  return prompt;
}

/**
 * Build daily brief prompt
 */
export function buildDailyBriefPrompt(data: {
  followUpsDue: number;
  overdueFollowUps: number;
  newQualifiedLeads: number;
  pendingReplies: number;
  meetingsToday: number;
  hotOpportunities: number;
  leadsGoingCold: number;
  topActions: Array<{ action: string; reason: string }>;
}): string {
  return `Generate a concise morning outreach brief based on this data:

FOLLOW-UPS DUE TODAY: ${data.followUpsDue}
OVERDUE FOLLOW-UPS: ${data.overdueFollowUps}
NEW QUALIFIED LEADS: ${data.newQualifiedLeads}
PENDING REPLIES: ${data.pendingReplies}
MEETINGS TODAY: ${data.meetingsToday}
HOT OPPORTUNITIES: ${data.hotOpportunities}
LEADS GOING COLD: ${data.leadsGoingCold}

TOP RECOMMENDED ACTIONS:
${data.topActions.map((a, i) => `${i + 1}. ${a.action} — ${a.reason}`).join("\n")}

Generate a brief, actionable morning summary. Be direct and specific. Format as:
{
  "greeting": "Good morning brief message",
  "urgentItems": ["item1", "item2"],
  "topPriorities": ["priority1", "priority2", "priority3", "priority4", "priority5"],
  "insight": "One sentence insight about pipeline health"
}`;
}
