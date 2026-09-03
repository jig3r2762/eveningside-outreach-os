import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importData, autoDetectMapping, ImportRow, ImportMapping } from "@/lib/import/csv-importer";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { rows, mapping } = body as { rows: ImportRow[]; mapping: ImportMapping };

      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "No rows provided" }, { status: 400 });
      }

      const result = await importData(rows, mapping, session.user.id);
      return NextResponse.json(result);
    } else {
      // Form data multipart for file upload
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const text = await file.text();
      const parsed = Papa.parse<ImportRow>(text, { header: true, skipEmptyLines: true });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        return NextResponse.json({ error: "Failed to parse CSV file", details: parsed.errors }, { status: 400 });
      }

      const headers = parsed.meta.fields || [];
      const autoMapping = autoDetectMapping(headers);

      return NextResponse.json({
        headers,
        rows: parsed.data.slice(0, 50), // Preview sample
        totalRows: parsed.data.length,
        autoMapping,
      });
    }
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
