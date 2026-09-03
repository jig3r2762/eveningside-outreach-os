import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { DEFAULT_FOLLOWUP_CADENCE, syncAllLeadsCadence } from "@/lib/followup-cadence";

export async function GET() {
  try {
    const setting = await prisma.followUpSetting.findUnique({
      where: { id: "default" },
    });

    // Run dynamic sync for any leads needing cadence computation
    await syncAllLeadsCadence();

    return NextResponse.json(setting || DEFAULT_FOLLOWUP_CADENCE);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { f1Days, f2Days, f3Days, maxFollowUps, autoSchedule } = body;

    const setting = await prisma.followUpSetting.upsert({
      where: { id: "default" },
      update: {
        f1Days: f1Days !== undefined ? parseInt(f1Days) : 3,
        f2Days: f2Days !== undefined ? parseInt(f2Days) : 7,
        f3Days: f3Days !== undefined ? parseInt(f3Days) : 14,
        maxFollowUps: maxFollowUps !== undefined ? Math.min(parseInt(maxFollowUps), 3) : 3,
        autoSchedule: autoSchedule !== undefined ? Boolean(autoSchedule) : true,
      },
      create: {
        id: "default",
        f1Days: f1Days !== undefined ? parseInt(f1Days) : 3,
        f2Days: f2Days !== undefined ? parseInt(f2Days) : 7,
        f3Days: f3Days !== undefined ? parseInt(f3Days) : 14,
        maxFollowUps: maxFollowUps !== undefined ? Math.min(parseInt(maxFollowUps), 3) : 3,
        autoSchedule: autoSchedule !== undefined ? Boolean(autoSchedule) : true,
      },
    });

    // Recompute cadence for all existing leads systematically
    await syncAllLeadsCadence();

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
