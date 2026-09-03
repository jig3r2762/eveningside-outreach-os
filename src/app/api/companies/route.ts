import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const companySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url().optional().or(z.literal('')),
  country: z.string().optional(),
  stateRegion: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
  subIndustry: z.string().optional(),
  companySize: z.string().optional(),
  estimatedEmployees: z.string().optional(),
  revenueRange: z.string().optional(),
  manufacturingType: z.string().optional(),
  productsServices: z.string().optional(),
  numberOfLocations: z.coerce.number().optional(),
  primaryMarket: z.string().optional(),
  targetMarket: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const country = searchParams.get('country');
    const industry = searchParams.get('industry');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      status: { not: 'ARCHIVED' }
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { domain: { contains: search } },
        { industry: { contains: search } },
      ];
    }

    if (country) where.country = country;
    if (industry) where.industry = industry;
    if (status) where.status = status;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: {
            select: { contacts: true, leads: true, activities: true }
          },
          assignedTo: {
            select: { name: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.company.count({ where })
    ]);

    return NextResponse.json({
      data: companies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function extractDomain(url: string | undefined | null) {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsedUrl.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = companySchema.parse(body);
    const domain = extractDomain(validatedData.website);

    // Check for duplicates
    const OR_conditions = [];
    if (domain) OR_conditions.push({ domain });
    if (validatedData.name) OR_conditions.push({ name: validatedData.name });
    if (validatedData.linkedinUrl) OR_conditions.push({ linkedinUrl: validatedData.linkedinUrl });

    if (OR_conditions.length > 0) {
      const existing = await prisma.company.findFirst({
        where: { OR: OR_conditions }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Company might already exist (matching name, domain, or LinkedIn URL)' },
          { status: 409 }
        );
      }
    }

    const company = await prisma.company.create({
      data: {
        ...validatedData,
        domain,
        assignedToId: session.user?.id
      }
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
