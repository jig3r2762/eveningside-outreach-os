import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        company: true,
        primaryContact: true,
      }
    });
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const lead = await prisma.lead.create({
      data: json
    });
    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
