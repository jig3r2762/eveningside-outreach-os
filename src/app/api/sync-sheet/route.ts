import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncFromGoogleSheetUrl } from "@/lib/import/csv-importer";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sheetUrl, mapping } = body;

    if (!sheetUrl) {
      return NextResponse.json({ error: "sheetUrl is required" }, { status: 400 });
    }

    const result = await syncFromGoogleSheetUrl(sheetUrl, session.user.id, mapping);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Google Sheet Sync error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync Google Sheet" }, { status: 500 });
  }
}
