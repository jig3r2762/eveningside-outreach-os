import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const clients = await prisma.client.findMany({
    include: { company: true, onboarding: true }
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const client = await prisma.client.create({
      data: json,
    });
    
    // Create an onboarding record
    await prisma.clientOnboarding.create({
      data: { clientId: client.id }
    });
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
