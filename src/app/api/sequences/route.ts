import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sequences = await prisma.sequence.findMany({
      include: {
        steps: { orderBy: { stepNumber: "asc" } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(sequences);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, channel, description, steps = [] } = body;

    if (!name || !channel) {
      return NextResponse.json({ error: "Name and channel are required" }, { status: 400 });
    }

    const sequence = await prisma.sequence.create({
      data: {
        name,
        channel,
        description,
        steps: {
          create: steps.map((s: any, idx: number) => ({
            stepNumber: idx + 1,
            dayOffset: parseInt(s.dayOffset) || 0,
            actionType: s.actionType || "FIRST_MESSAGE",
            description: s.description || "",
            channel: s.channel || channel,
          })),
        },
      },
      include: { steps: true },
    });

    return NextResponse.json(sequence, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
