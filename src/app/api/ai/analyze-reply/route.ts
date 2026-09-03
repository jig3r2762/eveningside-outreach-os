import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { logAiUsage } from "@/lib/ai-governance";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { activityId, replyText, leadId, companyId } = await req.json();

    if (!activityId || !replyText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Mock AI Analysis Logic (simulated latency and extraction)
    // In production, this would call OpenAI or another LLM
    
    let sentiment = "NEUTRAL";
    let intent = "INFORMATION_REQUEST";
    let painPoints = "";
    let budget = "";
    let authority = "";
    let timeline = "";
    let objections = "";
    let recommendedResponse = "";
    let recommendedAction = "";

    const lowerText = replyText.toLowerCase();

    if (lowerText.includes("interested") || lowerText.includes("demo") || lowerText.includes("call")) {
      sentiment = "INTERESTED";
      intent = "DEMO_REQUEST";
      recommendedResponse = "Hi [Name],\n\nGlad to hear you're interested! How does your calendar look for a brief 15-minute chat next Tuesday or Wednesday?\n\nBest,\n[Your Name]";
      recommendedAction = "Schedule Discovery Call";
    } else if (lowerText.includes("pricing") || lowerText.includes("cost")) {
      sentiment = "INTERESTED";
      intent = "PRICING_INQUIRY";
      budget = "Inquiring about cost structure";
      recommendedResponse = "Hi [Name],\n\nThanks for reaching out! Our pricing scales based on volume and requirements. Can we schedule a brief call so I can understand your needs and provide an accurate quote?\n\nBest,\n[Your Name]";
      recommendedAction = "Send Pricing Guide & Request Meeting";
    } else if (lowerText.includes("not interested") || lowerText.includes("unsubscribe") || lowerText.includes("remove me")) {
      sentiment = "NOT_INTERESTED";
      intent = "DECLINE";
      recommendedResponse = "Understood, I'll remove you from our list. Have a great day!";
      recommendedAction = "Opt-out and Mark as Disqualified";
    } else if (lowerText.includes("out of office") || lowerText.includes("ooo")) {
      sentiment = "OUT_OF_OFFICE";
      intent = "INFORMATION_REQUEST";
      recommendedResponse = "";
      recommendedAction = "Pause Cadence and Follow-up later";
    } else {
      sentiment = "SKEPTICAL";
      intent = "OBJECTION";
      objections = "Unsure of value proposition";
      recommendedResponse = "Hi [Name],\n\nI understand your hesitation. Here's a brief case study on how we helped a similar company overcome exactly what you're facing.\n\nWould you be open to a 10-minute chat next week to see if it makes sense for you?\n\nBest,\n[Your Name]";
      recommendedAction = "Send Case Study";
    }

    if (lowerText.includes("we are struggling with") || lowerText.includes("pain")) {
      painPoints = "Workflow inefficiencies, manual processes";
    }
    if (lowerText.includes("q4") || lowerText.includes("next year")) {
      timeline = "Q4 / Next Year";
    }
    if (lowerText.includes("director") || lowerText.includes("manager") || lowerText.includes("vp")) {
      authority = "Decision Maker / Evaluator";
    }

    // Save to DB
    const analysis = await prisma.conversationAnalysis.upsert({
      where: { activityId },
      update: {
        sentiment,
        intent,
        painPoints,
        budget,
        authority,
        timeline,
        objections,
        recommendedResponse,
        recommendedAction,
        isApproved: false,
        analyzedAt: new Date()
      },
      create: {
        activityId,
        sentiment,
        intent,
        painPoints,
        budget,
        authority,
        timeline,
        objections,
        recommendedResponse,
        recommendedAction,
        isApproved: false,
      }
    });

    // Log AI usage
    await logAiUsage({
      featureName: "REPLY_ANALYSIS",
      inputTokens: Math.ceil(replyText.length / 4), // rough estimate
      outputTokens: 150,
      cost: 0.001,
      confidence: 0.88,
      leadId,
      companyId
    });

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error("Error analyzing reply:", error);
    return NextResponse.json({ error: "Failed to analyze reply" }, { status: 500 });
  }
}
