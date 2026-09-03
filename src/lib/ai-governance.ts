import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AiUsageLogParams {
  featureName: string;
  modelName?: string;
  promptVersion?: string;
  inputTokens: number;
  outputTokens: number;
  cost?: number; // estimated cost
  confidence?: number;
  humanApproved?: boolean;
  leadId?: string;
  companyId?: string;
}

export async function logAiUsage({
  featureName,
  modelName = "gpt-4o-mini",
  promptVersion = "v2.0",
  inputTokens,
  outputTokens,
  cost = 0,
  confidence = 1.0,
  humanApproved = false,
  leadId,
  companyId,
}: AiUsageLogParams) {
  try {
    const log = await prisma.aiGovernanceLog.create({
      data: {
        featureName,
        modelName,
        promptVersion,
        inputTokens,
        outputTokens,
        estimatedCost: cost,
        confidence,
        humanApproved,
        leadId,
        companyId,
      },
    });
    return log;
  } catch (error) {
    console.error("Failed to log AI usage:", error);
    // Silent fail for non-critical logging
    return null;
  }
}
