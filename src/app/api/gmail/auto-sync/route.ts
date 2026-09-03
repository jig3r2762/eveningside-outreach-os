import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchSentEmailsFromGmailApi } from "@/lib/gmail/gmail-live-fetcher";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { accessToken, maxResults } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Google OAuth Access Token is required for direct automated Gmail sync." },
        { status: 400 }
      );
    }

    const result = await fetchSentEmailsFromGmailApi(
      accessToken,
      session.user.id,
      maxResults ? parseInt(maxResults) : 100
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Direct Gmail Auto-Sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to auto-sync with Gmail API." },
      { status: 500 }
    );
  }
}
