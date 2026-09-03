import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const contactSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  companyId: z.string().min(1, 'Company ID is required'),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  country: z.string().optional(),
  decisionMakerLevel: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const companyId = searchParams.get('companyId');
    const decisionMakerLevel = searchParams.get('decisionMakerLevel');
    const status = searchParams.get('status');
    const verificationStatus = searchParams.get('verificationStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      contactStatus: { not: 'ARCHIVED' }
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { company: { name: { contains: search } } }
      ];
    }

    if (companyId) where.companyId = companyId;
    if (decisionMakerLevel) where.decisionMakerLevel = decisionMakerLevel;
    if (status) where.contactStatus = status;
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          company: {
            select: { id: true, name: true }
          },
          assignedTo: {
            select: { name: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where })
    ]);

    return NextResponse.json({
      data: contacts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        verificationStatus: 'UNVERIFIED',
        assignedToId: session.user?.id
      }
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
