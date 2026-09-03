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
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, domain: true }
        },
        assignedTo: { select: { id: true, name: true } },
        activities: {
          orderBy: { date: 'desc' },
          include: {
            createdBy: { select: { name: true } }
          }
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: { select: { name: true } }
          }
        },
        notesRel: {
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

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
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
    
    const contact = await prisma.contact.update({
      where: { id },
      data: body
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
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
    await prisma.contact.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
