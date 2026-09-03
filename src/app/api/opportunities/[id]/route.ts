import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  estimatedValue: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  stage: z.string().optional(),
  problem: z.string().optional(),
  proposedSolution: z.string().optional(),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        owner: true,
        proposals: true,
        meetings: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json(opportunity);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const data = updateSchema.parse(json);

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data,
    });

    return NextResponse.json(opportunity);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid data" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.opportunity.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
