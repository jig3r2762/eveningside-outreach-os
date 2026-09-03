import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { matchAndSyncSentEmails, parseRawSentEmailText } from "@/lib/gmail/gmail-matcher";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rawText, emails } = body;

    let emailRecords = emails || [];

    if (rawText && typeof rawText === "string") {
      const parsed = parseRawSentEmailText(rawText);
      emailRecords = [...emailRecords, ...parsed];
    }

    if (emailRecords.length === 0) {
      return NextResponse.json(
        { error: "No valid email records or email addresses found in the input." },
        { status: 400 }
      );
    }

    const result = await matchAndSyncSentEmails(emailRecords, session.user.id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Gmail Sync Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process Gmail sent emails." },
      { status: 500 }
    );
  }
}
