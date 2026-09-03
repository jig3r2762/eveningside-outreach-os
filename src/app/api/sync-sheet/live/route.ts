import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { syncFromGoogleSheetUrl } from "@/lib/import/csv-importer";
import { syncAllLeadsCadence } from "@/lib/followup-cadence";

// GET: Check sync status and run auto-sync if url is saved
export async function GET(req: NextRequest) {
  try {
    const setting = await prisma.followUpSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting?.googleSheetUrl) {
      return NextResponse.json({
        hasUrl: false,
        message: "No permanent Google Sheet URL configured.",
      });
    }

    const adminUser = await prisma.user.findFirst();
    if (!adminUser) throw new Error("No user found in database");

    // Run sync from saved Google Sheet URL
    const result = await syncFromGoogleSheetUrl(setting.googleSheetUrl, adminUser.id);

    // Recompute cadence systematically for all leads
    await syncAllLeadsCadence();

    // Update lastSheetSync timestamp
    await prisma.followUpSetting.update({
      where: { id: "default" },
      data: { lastSheetSync: new Date() },
    });

    return NextResponse.json({
      success: true,
      hasUrl: true,
      lastSync: new Date(),
      result,
    });
  } catch (error: any) {
    console.error("Live Sheet Auto-Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Save Google Sheet URL or receive Webhook trigger from Google Sheet onEdit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sheetUrl } = body;

    let targetUrl = sheetUrl;

    if (targetUrl) {
      await prisma.followUpSetting.upsert({
        where: { id: "default" },
        update: { googleSheetUrl: targetUrl.trim() },
        create: {
          id: "default",
          googleSheetUrl: targetUrl.trim(),
        },
      });
    } else {
      const setting = await prisma.followUpSetting.findUnique({
        where: { id: "default" },
      });
      targetUrl = setting?.googleSheetUrl;
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: "No Google Sheet URL provided or saved." },
        { status: 400 }
      );
    }

    const adminUser = await prisma.user.findFirst();
    if (!adminUser) throw new Error("No user found");

    const result = await syncFromGoogleSheetUrl(targetUrl, adminUser.id);
    await syncAllLeadsCadence();

    await prisma.followUpSetting.update({
      where: { id: "default" },
      data: { lastSheetSync: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Google Sheet successfully synced in real-time!",
      lastSync: new Date(),
      result,
    });
  } catch (error: any) {
    console.error("Sheet Sync POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
