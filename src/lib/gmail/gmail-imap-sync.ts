import { ImapFlow } from "imapflow";
import { matchAndSyncSentEmails, SentEmailRecord, GmailSyncResult } from "./gmail-matcher";

export interface ImapSyncOptions {
  email: string;
  appPassword: string; // 16-letter Google App Password
  daysBack?: number;
}

/**
 * Connect directly to Gmail / Google Workspace via IMAP using an App Password,
 * fetch sent emails from the Sent mailbox, and update matching companies.
 */
export async function syncSentEmailsViaImap(
  options: ImapSyncOptions,
  userId: string
): Promise<GmailSyncResult> {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: options.email.trim(),
      pass: options.appPassword.replace(/\s+/g, "").trim(), // Strip spaces from Google App Password
    },
    logger: false,
  });

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - (options.daysBack || 60));

  const sentRecords: SentEmailRecord[] = [];

  try {
    await client.connect();

    // 1. Open the Sent Mail mailbox (Gmail standard name is "[Gmail]/Sent Mail" or "INBOX.Sent")
    let mailbox = await client.getMailboxLock("[Gmail]/Sent Mail");
    if (!mailbox) {
      mailbox = await client.getMailboxLock("Sent");
    }

    try {
      // 2. Fetch messages since sinceDate
      for await (const message of client.fetch(
        { since: sinceDate },
        { envelope: true, internalDate: true, bodyStructure: true }
      )) {
        if (!message.envelope) continue;

        const toList = message.envelope.to || [];
        const ccList = message.envelope.cc || [];
        const allRecipients = [...toList, ...ccList];

        const subject = message.envelope.subject || "Email Outreach";
        const date = message.envelope.date || message.internalDate || new Date();

        for (const recipient of allRecipients) {
          if (!recipient.address) continue;
          sentRecords.push({
            toEmail: recipient.address.toLowerCase().trim(),
            recipientName: recipient.name || undefined,
            sentDate: date,
            subject,
          });
        }
      }
    } finally {
      mailbox.release();
    }

    await client.logout();
  } catch (err: any) {
    console.error("IMAP Connection Error:", err);
    throw new Error(
      `Gmail connection failed: ${err.message || "Invalid Google email or App Password. Make sure 2-Step Verification & App Password are used."}`
    );
  }

  // 3. Match against companies in the database
  return matchAndSyncSentEmails(sentRecords, userId);
}
