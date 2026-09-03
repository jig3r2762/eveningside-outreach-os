import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assignedToId = searchParams.get("assignedToId");

  try {
    const tasks = await prisma.task.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(assignedToId ? { assignedToId } : {}),
      },
      include: {
        lead: {
          include: {
            company: { select: { id: true, name: true } },
            primaryContact: { select: { id: true, fullName: true } },
          },
        },
        contact: { select: { id: true, fullName: true } },
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(tasks);
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
    const { title, description, leadId, contactId, companyId, channel, priority = "MEDIUM", dueDate, assignedToId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        leadId,
        contactId,
        companyId,
        channel,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || session.user.id,
        createdById: session.user.id,
        status: "PENDING",
      },
      include: { lead: true, company: true },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
