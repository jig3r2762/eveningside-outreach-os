import { matchAndSyncSentEmails, SentEmailRecord, GmailSyncResult } from "./gmail-matcher";

/**
 * Fetch sent emails directly from Gmail API using an OAuth Access Token
 */
export async function fetchSentEmailsFromGmailApi(
  accessToken: string,
  userId: string,
  maxResults: number = 100
): Promise<GmailSyncResult> {
  // 1. List sent messages from Gmail
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:me&maxResults=${maxResults}`;
  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(`Gmail API error: ${listResponse.statusText} (${errorText})`);
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];

  const sentRecords: SentEmailRecord[] = [];

  // 2. Fetch details for each sent message
  for (const msg of messages.slice(0, maxResults)) {
    try {
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`;
      const msgRes = await fetch(msgUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();

      const headers = msgData.payload?.headers || [];
      const toHeader = headers.find((h: any) => h.name.toLowerCase() === "to")?.value || "";
      const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "";
      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

      // Extract emails from "To:" header (e.g., "John Doe <john@company.com>, Jane <jane@domain.com>")
      const emailMatches = toHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];

      const sentDate = dateHeader ? new Date(dateHeader) : (msgData.internalDate ? new Date(parseInt(msgData.internalDate)) : new Date());

      for (const toEmail of emailMatches) {
        sentRecords.push({
          toEmail,
          sentDate,
          subject: subjectHeader || "Email Outreach",
          snippet: msgData.snippet || subjectHeader,
        });
      }
    } catch (err) {
      console.error(`Error fetching message ${msg.id}:`, err);
    }
  }

  // 3. Match against companies in the database
  return matchAndSyncSentEmails(sentRecords, userId);
}
