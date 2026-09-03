import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const opportunitySchema = z.object({
  name: z.string().min(1),
  companyId: z.string().min(1),
  estimatedValue: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  stage: z.string().optional(),
});

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    include: { company: true }
  });
  return NextResponse.json(opportunities);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = opportunitySchema.parse(json);
    
    const opportunity = await prisma.opportunity.create({
      data,
    });
    
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
