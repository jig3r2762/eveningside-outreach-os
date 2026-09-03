import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        contacts: {
          orderBy: { createdAt: 'desc' }
        },
        leads: {
          include: {
            primaryContact: { select: { fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          orderBy: { date: 'desc' },
          include: {
            createdBy: { select: { name: true } },
            contact: { select: { fullName: true } }
          }
        },
        research: {
          include: {
            claims: true,
            researcher: { select: { name: true } }
          },
          orderBy: { researchDate: 'desc' }
        },
        notes: {
          include: {
            createdBy: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        opportunities: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const company = await prisma.company.update({
      where: { id },
      data: body
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.company.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
