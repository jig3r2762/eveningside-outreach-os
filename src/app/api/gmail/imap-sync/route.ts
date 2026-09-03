import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncSentEmailsViaImap } from "@/lib/gmail/gmail-imap-sync";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, appPassword, daysBack } = body;

    if (!email || !appPassword) {
      return NextResponse.json(
        { error: "Gmail address and Google App Password are required." },
        { status: 400 }
      );
    }

    const result = await syncSentEmailsViaImap(
      {
        email,
        appPassword,
        daysBack: daysBack ? parseInt(daysBack) : 90,
      },
      session.user.id
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Gmail App Password Sync Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to connect to Gmail." },
      { status: 500 }
    );
  }
}
