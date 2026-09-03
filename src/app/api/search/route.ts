import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ companies: [], contacts: [], leads: [] });
  }

  try {
    const [companies, contacts, leads, opportunities] = await Promise.all([
      prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { website: { contains: q } },
            { industry: { contains: q } },
            { country: { contains: q } },
          ],
        },
        take: 6,
        select: { id: true, name: true, industry: true, country: true, leadScore: true },
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { fullName: { contains: q } },
            { email: { contains: q } },
            { jobTitle: { contains: q } },
          ],
        },
        take: 6,
        include: { company: { select: { id: true, name: true } } },
      }),
      prisma.lead.findMany({
        where: {
          OR: [
            { company: { name: { contains: q } } },
            { potentialPainPoints: { contains: q } },
          ],
        },
        take: 6,
        include: {
          company: { select: { id: true, name: true } },
          primaryContact: { select: { fullName: true } },
        },
      }),
      prisma.opportunity.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { company: { name: { contains: q } } },
          ],
        },
        take: 6,
        include: { company: { select: { id: true, name: true } } },
      }),
    ]);

    return NextResponse.json({ companies, contacts, leads, opportunities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
