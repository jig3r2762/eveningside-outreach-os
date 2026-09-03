import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  status: z.string().optional(),
  outcome: z.string().optional(),
  summaryNotes: z.string().optional(),
  painDiscovered: z.string().optional(),
  budgetDiscovered: z.string().optional(),
  timelineDiscovered: z.string().optional(),
  decisionMakerDiscovered: z.string().optional(),
  nextAction: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        opportunity: true,
        lead: true,
        organizer: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting);
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

    const meeting = await prisma.meeting.update({
      where: { id },
      data,
    });

    if (data.outcome === "OPPORTUNITY_CREATED") {
      const existing = await prisma.opportunity.findFirst({
        where: { companyId: meeting.companyId, name: `${meeting.title} - Opportunity` },
      });
      if (!existing) {
        await prisma.opportunity.create({
          data: {
            name: `${meeting.title} - Opportunity`,
            companyId: meeting.companyId,
            contactId: meeting.contactId,
            leadId: meeting.leadId,
            stage: "DISCOVERY_CALL",
            problem: meeting.painDiscovered,
          },
        });
      }
    }

    return NextResponse.json(meeting);
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
    await prisma.meeting.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
