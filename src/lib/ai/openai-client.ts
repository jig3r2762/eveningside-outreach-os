/**
 * OpenAI Client Wrapper
 * Handles API calls with error handling and rate limiting.
 */

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

export function isAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: options?.model || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return null;
  }
}
