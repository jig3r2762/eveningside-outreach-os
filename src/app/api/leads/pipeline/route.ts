import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { LEAD_STAGES } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");
    const minScore = searchParams.get("minScore");
    const market = searchParams.get("market");

    const where: any = {};

    // Role check: non-admin restricted to their own leads
    if (session.user.role !== "ADMIN") {
      where.assignedToId = session.user.id;
    } else if (ownerId && ownerId !== "all") {
      where.assignedToId = ownerId;
    }

    if (minScore) {
      where.leadScore = { gte: parseInt(minScore) };
    }
    if (market && market !== "all") {
      where.market = market;
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, industry: true, country: true, website: true } },
        primaryContact: { select: { id: true, fullName: true, jobTitle: true, email: true, linkedinUrl: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Group leads by stage
    const grouped = LEAD_STAGES.reduce((acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage);
      return acc;
    }, {} as Record<string, typeof leads>);

    return NextResponse.json({ data: grouped, totalCount: leads.length });
  } catch (error) {
    console.error("Error fetching pipeline leads:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
