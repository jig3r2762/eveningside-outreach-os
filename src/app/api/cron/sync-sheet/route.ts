import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncFromGoogleSheetUrl } from "@/lib/import/csv-importer";
import { syncAllLeadsCadence } from "@/lib/followup-cadence";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch saved Google Sheet URL from database
    const setting = await prisma.followUpSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting?.googleSheetUrl) {
      return NextResponse.json({
        success: true,
        message: "Cron skipped: No permanent Google Sheet URL configured in Settings.",
      });
    }

    const adminUser = await prisma.user.findFirst();
    if (!adminUser) {
      return NextResponse.json({ error: "No user found in database" }, { status: 500 });
    }

    // 2. Perform live synchronization
    const result = await syncFromGoogleSheetUrl(setting.googleSheetUrl, adminUser.id);

    // 3. Recompute follow-up cadence systematically
    await syncAllLeadsCadence();

    // 4. Update lastSheetSync timestamp
    await prisma.followUpSetting.update({
      where: { id: "default" },
      data: { lastSheetSync: new Date() },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    console.error("Vercel Cron Sheet Auto-Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
