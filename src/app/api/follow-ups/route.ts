import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { completeFollowUp } from "@/lib/follow-up-engine";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const followUps = await prisma.followUp.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        lead: {
          include: {
            company: { select: { id: true, name: true, country: true, industry: true } },
            primaryContact: { select: { id: true, fullName: true, email: true, linkedinUrl: true } },
          },
        },
        contact: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(followUps);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { leadId, contactId, dueDate, channel = "LINKEDIN", priority = "MEDIUM", notes } = body;

    if (!dueDate) {
      return NextResponse.json({ error: "dueDate is required" }, { status: 400 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        contactId,
        dueDate: new Date(dueDate),
        channel,
        priority,
        notes,
        status: "PENDING",
      },
      include: { lead: true },
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, outcome, notes, status = "COMPLETED" } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updated = await completeFollowUp(id, outcome || "Completed", notes);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
