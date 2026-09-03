import prisma from "../db";
import { extractDomain } from "../utils";

export interface SentEmailRecord {
  toEmail: string;
  recipientName?: string;
  sentDate: string | Date;
  subject?: string;
  snippet?: string;
}

export interface GmailSyncResult {
  totalProcessed: number;
  companiesMatched: number;
  contactsMatched: number;
  leadsUpdated: number;
  activitiesCreated: number;
  unmatched: string[];
}

/**
 * Match a list of sent emails against existing companies and contacts in the database.
 */
export async function matchAndSyncSentEmails(
  emails: SentEmailRecord[],
  userId: string
): Promise<GmailSyncResult> {
  const result: GmailSyncResult = {
    totalProcessed: emails.length,
    companiesMatched: 0,
    contactsMatched: 0,
    leadsUpdated: 0,
    activitiesCreated: 0,
    unmatched: [],
  };

  for (const item of emails) {
    if (!item.toEmail || !item.toEmail.includes("@")) continue;

    const emailClean = item.toEmail.toLowerCase().trim();
    const domain = emailClean.split("@")[1]?.toLowerCase().trim();
    const sentDate = new Date(item.sentDate);
    if (isNaN(sentDate.getTime())) continue;

    // 1. Try finding contact by email
    let contact = await prisma.contact.findFirst({
      where: { email: { equals: emailClean } },
      include: { company: true },
    });

    let companyId: string | null = contact?.companyId || null;

    // 2. If no contact match, try finding company by domain (excluding generic domains like gmail.com)
    const isGenericDomain = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "rediffmail.com"].includes(domain);

    if (!companyId && !isGenericDomain && domain) {
      const company = await prisma.company.findFirst({
        where: {
          OR: [
            { domain: { equals: domain } },
            { website: { contains: domain } },
          ],
        },
      });
      if (company) {
        companyId = company.id;
        result.companiesMatched++;

        // If no contact exists yet, create one from the email
        if (!contact) {
          contact = (await prisma.contact.create({
            data: {
              fullName: item.recipientName || emailClean.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              email: emailClean,
              companyId: company.id,
              verificationStatus: "VERIFIED",
              outreachStatus: "MESSAGE_SENT",
              firstContactDate: sentDate,
              lastContacted: sentDate,
              emailSource: "Gmail Sync",
              assignedToId: userId,
            },
            include: { company: true },
          })) as any;
          result.contactsMatched++;
        }
      }
    }

    if (!companyId) {
      result.unmatched.push(emailClean);
      continue;
    }

    // 3. Find lead for this company
    let lead = await prisma.lead.findFirst({
      where: { companyId },
    });

    if (!lead) {
      // Create lead if doesn't exist
      lead = await prisma.lead.create({
        data: {
          companyId,
          primaryContactId: contact?.id,
          stage: "CONTACTED",
          outreachStatus: "MESSAGE_SENT",
          firstContactDate: sentDate,
          lastContactDate: sentDate,
          source: "Gmail",
          assignedToId: userId,
        },
      });
      result.leadsUpdated++;
    } else {
      // Update existing lead dates
      const isEarlier = !lead.firstContactDate || sentDate < new Date(lead.firstContactDate);
      const isLater = !lead.lastContactDate || sentDate > new Date(lead.lastContactDate);

      const updateData: any = {
        stage: lead.stage === "NEW" ? "CONTACTED" : lead.stage,
        outreachStatus: lead.outreachStatus === "NOT_CONTACTED" ? "MESSAGE_SENT" : lead.outreachStatus,
      };

      if (isEarlier) updateData.firstContactDate = sentDate;
      if (isLater) updateData.lastContactDate = sentDate;
      if (contact && !lead.primaryContactId) updateData.primaryContactId = contact.id;

      await prisma.lead.update({
        where: { id: lead.id },
        data: updateData,
      });
      result.leadsUpdated++;
    }

    // 4. Update contact dates
    if (contact) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          outreachStatus: "MESSAGE_SENT",
          firstContactDate: contact.firstContactDate && contact.firstContactDate < sentDate ? contact.firstContactDate : sentDate,
          lastContacted: contact.lastContacted && contact.lastContacted > sentDate ? contact.lastContacted : sentDate,
        },
      });
    }

    // 5. Create Activity record if not duplicated
    const existingAct = await prisma.activity.findFirst({
      where: {
        leadId: lead.id,
        channel: "EMAIL",
        date: {
          gte: new Date(sentDate.getTime() - 60000),
          lte: new Date(sentDate.getTime() + 60000),
        },
      },
    });

    if (!existingAct) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          contactId: contact?.id,
          companyId,
          channel: "EMAIL",
          activityType: "EMAIL_SENT",
          direction: "OUTBOUND",
          subject: item.subject || "Email Outreach",
          message: item.snippet || item.subject || `Email sent to ${emailClean}`,
          outcome: "Message Sent",
          date: sentDate,
          createdById: userId,
        },
      });
      result.activitiesCreated++;
    }
  }

  return result;
}

/**
 * Parse raw text (e.g. copied list of sent emails or lines like "name@domain.com 2026-08-15 Subject")
 */
export function parseRawSentEmailText(rawText: string): SentEmailRecord[] {
  const records: SentEmailRecord[] = [];
  const lines = rawText.split(/\r?\n/);

  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const dateRegex = /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\w{3,9}\s+\d{1,2},?\s+\d{4})\b/;

  for (const line of lines) {
    if (!line.trim()) continue;

    const emailMatches = line.match(emailRegex);
    if (!emailMatches || emailMatches.length === 0) continue;

    const email = emailMatches[0];
    const dateMatch = line.match(dateRegex);
    const dateStr = dateMatch ? dateMatch[0] : new Date().toISOString();

    const subject = line.replace(email, "").replace(dateMatch ? dateMatch[0] : "", "").trim();

    records.push({
      toEmail: email,
      sentDate: new Date(dateStr),
      subject: subject || "Sent Email",
    });
  }

  return records;
}
