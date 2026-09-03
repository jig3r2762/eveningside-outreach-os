import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const proposalSchema = z.object({
  title: z.string().min(1),
  opportunityId: z.string().min(1),
  companyId: z.string().min(1),
  value: z.number().min(0).default(0),
});

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    include: { company: true, opportunity: true }
  });
  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = proposalSchema.parse(json);
    
    const proposal = await prisma.proposal.create({
      data,
    });
    
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
