import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const meetingSchema = z.object({
  title: z.string().min(1),
  companyId: z.string().min(1),
  scheduledAt: z.string().transform((str) => new Date(str)),
  durationMinutes: z.number().min(1).default(30),
  meetingType: z.string().default("DISCOVERY"),
});

export async function GET() {
  const meetings = await prisma.meeting.findMany({
    include: { company: true }
  });
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = meetingSchema.parse(json);
    
    const meeting = await prisma.meeting.create({
      data,
    });
    
    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
