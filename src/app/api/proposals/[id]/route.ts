import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  status: z.string().optional(),
  value: z.number().optional(),
  discount: z.number().optional(),
  paymentTerms: z.string().optional(),
  rejectionReason: z.string().optional(),
  scopeServices: z.string().optional(),
  documentUrl: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        opportunity: true,
        company: true,
        contact: true,
        createdBy: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposal);
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

    const proposal = await prisma.proposal.update({
      where: { id },
      data,
    });

    if (data.status === "ACCEPTED") {
      await prisma.opportunity.update({
        where: { id: proposal.opportunityId },
        data: { stage: "WON" },
      });
      // Also create a client if needed
      const existingClient = await prisma.client.findFirst({
        where: { opportunityId: proposal.opportunityId },
      });
      if (!existingClient) {
        const client = await prisma.client.create({
          data: {
            companyId: proposal.companyId,
            opportunityId: proposal.opportunityId,
            dealValue: proposal.value,
            status: "ONBOARDING",
          },
        });
        await prisma.clientOnboarding.create({
          data: {
            clientId: client.id,
            status: "IN_PROGRESS",
            checklist: JSON.stringify([
              { task: "Execute Master Services Agreement (MSA)", completed: false },
              { task: "Set up project communication channel", completed: false },
              { task: "Conduct Solution Architecture Kickoff Call", completed: false },
            ]),
          },
        });
      }
    }

    return NextResponse.json(proposal);
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
    await prisma.proposal.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
