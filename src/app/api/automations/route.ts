import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const automations = await prisma.automationRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(automations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const automation = await prisma.automationRule.create({
      data
    });
    return NextResponse.json(automation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 });
  }
}
