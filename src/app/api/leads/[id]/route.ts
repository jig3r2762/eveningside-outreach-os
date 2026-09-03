import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { processAutomation } from "@/lib/automation/rules-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            contacts: true,
            research: { include: { claims: true } },
          },
        },
        primaryContact: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        activities: {
          include: {
            createdBy: { select: { name: true } },
            contact: { select: { fullName: true } },
          },
          orderBy: { date: "desc" },
        },
        followUps: {
          include: { contact: { select: { fullName: true } } },
          orderBy: { dueDate: "asc" },
        },
        tasks: {
          include: { assignedTo: { select: { name: true } } },
          orderBy: { dueDate: "asc" },
        },
        notes: {
          include: { createdBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        stageHistory: {
          include: { changedBy: { select: { name: true } } },
          orderBy: { changedAt: "desc" },
        },
        opportunity: {
          include: {
            opportunityServices: { include: { service: true } },
            client: true,
          },
        },
        qualification: true,
        leadSequence: { include: { sequence: true } },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      stage,
      primaryContactId,
      assignedToId,
      potentialPainPoints,
      buyingSignals,
      recommendedService,
      market,
      source,
      pipelineValue,
      lostReason,
    } = body;

    const existing = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const isStageChanging = stage && stage !== existing.stage;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(stage !== undefined ? { stage } : {}),
        ...(primaryContactId !== undefined ? { primaryContactId } : {}),
        ...(assignedToId !== undefined ? { assignedToId } : {}),
        ...(potentialPainPoints !== undefined ? { potentialPainPoints } : {}),
        ...(buyingSignals !== undefined ? { buyingSignals } : {}),
        ...(recommendedService !== undefined ? { recommendedService } : {}),
        ...(market !== undefined ? { market } : {}),
        ...(source !== undefined ? { source } : {}),
        ...(pipelineValue !== undefined ? { pipelineValue: parseFloat(pipelineValue) } : {}),
        ...(lostReason !== undefined ? { lostReason } : {}),
      },
      include: { company: true, primaryContact: true },
    });

    if (isStageChanging) {
      await prisma.stageHistory.create({
        data: {
          leadId: id,
          fromStage: existing.stage,
          toStage: stage,
          changedById: session.user.id,
        },
      });

      if (stage === "LOST") {
        await processAutomation("LEAD_LOST", { leadId: id, userId: session.user.id });
      }
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
