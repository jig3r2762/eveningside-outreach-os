import Papa from "papaparse";
import prisma from "@/lib/db";
import { extractDomain } from "@/lib/utils";

export interface ImportRow {
  [key: string]: string | undefined;
}

export interface ImportMapping {
  companyName?: string;
  website?: string;
  country?: string;
  location?: string;
  city?: string;
  industry?: string;
  segment?: string;
  briefOverview?: string;
  medium?: string;
  source?: string;
  subIndustry?: string;
  decisionMaker?: string;
  contactName?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  score?: string;
  leadStatus?: string;
  firstContactDate?: string;
  lastContactDate?: string;
  followUpDate?: string;
  f1Date?: string;
  f1Status?: string;
  f2Date?: string;
  f2Status?: string;
  f3Date?: string;
  f3Status?: string;
  notes?: string;
  channel?: string;
  outreachStatus?: string;
  emailStatus?: string;
  linkedinStatus?: string;
  assignedToEmail?: string;
}

export interface ImportResult {
  totalRows: number;
  companiesCreated: number;
  companiesUpdated: number;
  contactsCreated: number;
  contactsUpdated: number;
  leadsCreated: number;
  leadsUpdated: number;
  errors: Array<{ row: number; error: string }>;
  updatedRows: Array<{ row: number; company: string; contact?: string }>;
}

/**
 * Check for duplicate/existing company
 */
async function findExistingCompany(data: {
  name?: string;
  domain?: string;
  linkedinUrl?: string;
}): Promise<string | null> {
  if (data.domain) {
    const byDomain = await prisma.company.findFirst({
      where: { domain: data.domain },
      select: { id: true },
    });
    if (byDomain) return byDomain.id;
  }

  if (data.linkedinUrl) {
    const byLinkedin = await prisma.company.findFirst({
      where: { linkedinUrl: data.linkedinUrl },
      select: { id: true },
    });
    if (byLinkedin) return byLinkedin.id;
  }

  if (data.name) {
    const byName = await prisma.company.findFirst({
      where: { name: { equals: data.name } },
      select: { id: true },
    });
    if (byName) return byName.id;
  }

  return null;
}

/**
 * Check for duplicate/existing contact
 */
async function findExistingContact(data: {
  email?: string;
  linkedinUrl?: string;
  fullName?: string;
  companyId?: string;
}): Promise<string | null> {
  if (data.email) {
    const byEmail = await prisma.contact.findFirst({
      where: { email: data.email },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;
  }

  if (data.linkedinUrl) {
    const byLinkedin = await prisma.contact.findFirst({
      where: { linkedinUrl: data.linkedinUrl },
      select: { id: true },
    });
    if (byLinkedin) return byLinkedin.id;
  }

  if (data.fullName && data.companyId) {
    const byNameCompany = await prisma.contact.findFirst({
      where: {
        fullName: data.fullName,
        companyId: data.companyId,
      },
      select: { id: true },
    });
    if (byNameCompany) return byNameCompany.id;
  }

  return null;
}

/**
 * Enhanced Date Parser supporting DD-MM-YY, DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY, dd-mmm-yyyy
 */
export function parseDate(dateStr?: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();

  // 1. Check for DD-MM-YY or DD-MM-YYYY (e.g. 28-08-26, 29-08-26, 01-09-26, 31-08-2026)
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      year += 2000;
    }
    const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Standard ISO / Date constructor
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseContactString(contactStr?: string): { fullName?: string; jobTitle?: string; phone?: string } {
  if (!contactStr || !contactStr.trim()) return {};
  const s = contactStr.trim();

  // If looks like phone number
  if (/^[\d+\s()-]{7,}$/.test(s)) {
    return { phone: s };
  }

  // If contains "Name (Job Title)"
  const titleMatch = s.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (titleMatch) {
    return {
      fullName: titleMatch[1].trim(),
      jobTitle: titleMatch[2].trim(),
    };
  }

  return { fullName: s };
}

function normalizeStage(status?: string): string {
  if (!status) return "NEW";
  const s = status.trim().toUpperCase().replace(/\s+/g, "_");
  if (s.includes("INTERESTED") && !s.includes("NOT")) return "QUALIFIED_OPPORTUNITY";
  if (s.includes("CONVERSATION")) return "CONVERSATION";
  if (s.includes("CONTACTED")) return "CONTACTED";
  if (s.includes("CONVERTED") || s.includes("WON")) return "WON";
  if (s.includes("NOT_INTERESTED") || s.includes("DEAD") || s.includes("DECLINED")) return "LOST";
  if (s.includes("MEETING")) return "DISCOVERY_CALL";
  if (s.includes("PROPOSAL")) return "PROPOSAL";

  const validStages = [
    "NEW",
    "RESEARCHING",
    "QUALIFIED",
    "READY_TO_CONTACT",
    "CONTACTED",
    "CONNECTED",
    "CONVERSATION",
    "DISCOVERY_CALL",
    "QUALIFIED_OPPORTUNITY",
    "PROPOSAL",
    "NEGOTIATION",
    "WON",
    "LOST",
    "NURTURE",
  ];
  return validStages.includes(s) ? s : "NEW";
}

function normalizeOutreachStatus(status?: string): string {
  if (!status) return "NOT_CONTACTED";
  const s = status.trim().toUpperCase().replace(/\s+/g, "_");
  if (s.includes("SENT") && s.includes("REQ")) return "REQUEST_SENT";
  if (s.includes("SENT") || s === "YES" || s === "CONTACTED") return "MESSAGE_SENT";
  if (s.includes("ACCEPT") || s.includes("CONN")) return "ACCEPTED";
  if (s.includes("REPL") || s.includes("INTERESTED") || s.includes("CONVERSATION")) return "REPLIED";
  if (s.includes("MEET") || s.includes("CALL")) return "MEETING_BOOKED";
  if (s.includes("NOT_INT") || s.includes("DECLIN") || s.includes("DEAD")) return "NOT_INTERESTED";
  if (s === "NO" || s.includes("NOT_CONTACTED")) return "NOT_CONTACTED";
  return "NOT_CONTACTED";
}

/**
 * Import rows with the given field mapping (Supports both insert and real-time upsert)
 */
export async function importData(
  rows: ImportRow[],
  mapping: ImportMapping,
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    totalRows: rows.length,
    companiesCreated: 0,
    companiesUpdated: 0,
    contactsCreated: 0,
    contactsUpdated: 0,
    leadsCreated: 0,
    leadsUpdated: 0,
    errors: [],
    updatedRows: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const companyName = mapping.companyName ? row[mapping.companyName]?.trim() : undefined;
      if (!companyName) {
        // Skip empty spacer rows
        continue;
      }

      const website = mapping.website ? row[mapping.website]?.trim() : undefined;
      const domain = website ? extractDomain(website) : null;
      const countryRaw = mapping.country ? row[mapping.country]?.trim() : undefined;
      const locationRaw = mapping.location ? row[mapping.location]?.trim() : (mapping.city ? row[mapping.city]?.trim() : undefined);
      const industry = mapping.industry ? row[mapping.industry]?.trim() : undefined;
      const segment = mapping.segment ? row[mapping.segment]?.trim() : undefined;
      const briefOverview = mapping.briefOverview ? row[mapping.briefOverview]?.trim() : undefined;
      const medium = mapping.medium ? row[mapping.medium]?.trim() : undefined;
      const source = mapping.source ? row[mapping.source]?.trim() : undefined;
      const notes = mapping.notes ? row[mapping.notes]?.trim() : (briefOverview || undefined);

      // Extract country and location
      let country = countryRaw;
      let location = locationRaw;
      if (!country && location) {
        if (location.toLowerCase().includes("uk") || location.toLowerCase().includes("england") || location.toLowerCase().includes("london") || location.toLowerCase().includes("scotland") || location.toLowerCase().includes("wales")) {
          country = "United Kingdom";
        } else if (location.toLowerCase().includes("india") || location.toLowerCase().includes("gujarat") || location.toLowerCase().includes("ahmedabad") || location.toLowerCase().includes("delhi") || location.toLowerCase().includes("mumbai") || location.toLowerCase().includes("bengaluru")) {
          country = "India";
        } else if (location.toLowerCase().includes("us") || location.toLowerCase().includes("usa")) {
          country = "United States";
        }
      }

      // Contact Parsing
      const rawContact = mapping.decisionMaker ? row[mapping.decisionMaker] : (mapping.contactName ? row[mapping.contactName] : undefined);
      const parsedContact = parseContactString(rawContact);
      const contactName = parsedContact.fullName || (mapping.contactName ? row[mapping.contactName]?.trim() : undefined);
      const jobTitle = mapping.jobTitle ? row[mapping.jobTitle]?.trim() : parsedContact.jobTitle;

      // Extract LinkedIn URL
      let linkedinUrl = mapping.linkedinUrl ? row[mapping.linkedinUrl]?.trim() : undefined;
      if (linkedinUrl && !linkedinUrl.includes("linkedin.com") && !linkedinUrl.startsWith("http")) {
        linkedinUrl = undefined;
      }

      // Extract Business Email
      let email = mapping.email ? row[mapping.email]?.trim() : undefined;
      if (email && (!email.includes("@") || email.includes("(contact form)"))) {
        email = undefined;
      }

      const phone = mapping.phone ? row[mapping.phone]?.trim() : parsedContact.phone;

      const scoreStr = mapping.score ? row[mapping.score]?.trim() : undefined;
      const score = scoreStr ? parseInt(scoreStr) || 0 : (country === "United Kingdom" ? 85 : 80);

      const firstContactDate = mapping.firstContactDate ? parseDate(row[mapping.firstContactDate]) : null;
      const lastContactDate = mapping.lastContactDate ? parseDate(row[mapping.lastContactDate]) : null;
      const followUpDate = mapping.followUpDate ? parseDate(row[mapping.followUpDate]) : null;

      // F1, F2, F3 dates & statuses
      const f1Date = mapping.f1Date ? parseDate(row[mapping.f1Date]) : null;
      const f1Status = mapping.f1Status ? row[mapping.f1Status]?.trim() : undefined;
      const f2Date = mapping.f2Date ? parseDate(row[mapping.f2Date]) : null;
      const f2Status = mapping.f2Status ? row[mapping.f2Status]?.trim() : undefined;
      const f3Date = mapping.f3Date ? parseDate(row[mapping.f3Date]) : null;
      const f3Status = mapping.f3Status ? row[mapping.f3Status]?.trim() : undefined;

      // Outreach Status columns
      const emailStatusRaw = mapping.emailStatus ? row[mapping.emailStatus]?.trim() : (row["Email"] || row["email"] || (medium === "Email" ? "Sent" : undefined));
      const linkedinStatusRaw = mapping.linkedinStatus ? row[mapping.linkedinStatus]?.trim() : (row["LinkedIn"] || row["linkedin"]);
      const outreachStatusRaw = mapping.outreachStatus ? row[mapping.outreachStatus]?.trim() : (mapping.leadStatus ? row[mapping.leadStatus]?.trim() : undefined);

      const hasEmailSent = emailStatusRaw && (emailStatusRaw.toLowerCase().includes("sent") || emailStatusRaw.toLowerCase() === "yes");
      const hasLinkedinReq = linkedinStatusRaw && (linkedinStatusRaw.toLowerCase().includes("req") || linkedinStatusRaw.toLowerCase().includes("sent"));

      // Smart Stage & Outreach Status Inference
      let finalStage = "NEW";
      let finalOutreachStatus = "NOT_CONTACTED";

      if (outreachStatusRaw) {
        finalOutreachStatus = normalizeOutreachStatus(outreachStatusRaw);
        finalStage = normalizeStage(outreachStatusRaw);
      } else if (hasLinkedinReq) {
        finalOutreachStatus = "REQUEST_SENT";
        finalStage = "CONTACTED";
      } else if (hasEmailSent) {
        finalOutreachStatus = "MESSAGE_SENT";
        finalStage = "CONTACTED";
      }

      if (firstContactDate || f1Date || hasEmailSent || hasLinkedinReq) {
        if (finalStage === "NEW") finalStage = "CONTACTED";
        if (finalOutreachStatus === "NOT_CONTACTED") finalOutreachStatus = "MESSAGE_SENT";
      }

      // 1. Upsert Company
      let companyId = await findExistingCompany({
        name: companyName,
        domain: domain || undefined,
        linkedinUrl: linkedinUrl || undefined,
      });

      if (companyId) {
        await prisma.company.update({
          where: { id: companyId },
          data: {
            name: companyName,
            website: website || undefined,
            domain: domain || undefined,
            country: country || undefined,
            city: location || undefined,
            industry: industry || undefined,
            segment: segment || undefined,
            briefOverview: briefOverview || undefined,
            medium: medium || undefined,
            source: source || undefined,
            leadScore: score > 0 ? score : undefined,
            researchNotes: notes || briefOverview || undefined,
            assignedToId: userId,
          },
        });
        result.companiesUpdated++;
      } else {
        const newComp = await prisma.company.create({
          data: {
            name: companyName,
            website,
            domain,
            country,
            city: location,
            industry,
            segment,
            briefOverview,
            medium,
            source: source || "B2B Outreach List",
            leadScore: score,
            researchNotes: notes || briefOverview,
            assignedToId: userId,
          },
        });
        companyId = newComp.id;
        result.companiesCreated++;
      }

      // 2. Upsert Contact
      let contactId: string | undefined;
      if (contactName || email || linkedinUrl || phone) {
        const existingContactId = await findExistingContact({
          email,
          linkedinUrl,
          fullName: contactName,
          companyId,
        });

        if (existingContactId) {
          contactId = existingContactId;
          await prisma.contact.update({
            where: { id: existingContactId },
            data: {
              fullName: contactName || undefined,
              jobTitle: jobTitle || undefined,
              email: email || undefined,
              phone: phone || undefined,
              linkedinUrl: linkedinUrl || undefined,
              verificationStatus: email || linkedinUrl ? "VERIFIED" : undefined,
              outreachStatus: finalOutreachStatus,
              firstContactDate: firstContactDate || undefined,
              lastContacted: lastContactDate || firstContactDate || undefined,
              assignedToId: userId,
            },
          });
          result.contactsUpdated++;
        } else if (contactName || email || linkedinUrl) {
          const newContact = await prisma.contact.create({
            data: {
              companyId,
              fullName: contactName || "Decision Maker",
              jobTitle,
              email,
              phone,
              linkedinUrl,
              verificationStatus: email || linkedinUrl ? "VERIFIED" : "UNVERIFIED",
              outreachStatus: finalOutreachStatus,
              firstContactDate,
              lastContacted: lastContactDate || firstContactDate,
              assignedToId: userId,
            },
          });
          contactId = newContact.id;
          result.contactsCreated++;
        }
      }

      // 3. Upsert Lead
      const existingLead = await prisma.lead.findFirst({
        where: { companyId },
      });

      let leadId: string;

      if (existingLead) {
        leadId = existingLead.id;
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            primaryContactId: contactId || existingLead.primaryContactId,
            stage: finalStage,
            outreachStatus: finalOutreachStatus,
            leadScore: score > 0 ? score : existingLead.leadScore,
            market: country || existingLead.market,
            source: source || existingLead.source,
            segment: segment || existingLead.segment,
            briefOverview: briefOverview || existingLead.briefOverview,
            medium: medium || existingLead.medium,
            potentialPainPoints: notes || existingLead.potentialPainPoints,
            firstContactDate: firstContactDate || existingLead.firstContactDate,
            lastContactDate: lastContactDate || existingLead.lastContactDate || firstContactDate,
            followUpDate: followUpDate || f1Date || existingLead.followUpDate,
            f1Date: f1Date || existingLead.f1Date,
            f1Status: f1Status || existingLead.f1Status,
            f2Date: f2Date || existingLead.f2Date,
            f2Status: f2Status || existingLead.f2Status,
            f3Date: f3Date || existingLead.f3Date,
            f3Status: f3Status || existingLead.f3Status,
            assignedToId: userId,
          },
        });
        result.leadsUpdated++;
        result.updatedRows.push({ row: rowNum, company: companyName, contact: contactName });
      } else {
        const newLead = await prisma.lead.create({
          data: {
            companyId,
            primaryContactId: contactId,
            stage: finalStage,
            outreachStatus: finalOutreachStatus,
            leadScore: score,
            source: source || "B2B Outreach List",
            market: country,
            segment,
            briefOverview,
            medium,
            potentialPainPoints: notes || briefOverview,
            firstContactDate,
            lastContactDate,
            followUpDate: followUpDate || f1Date,
            f1Date,
            f1Status: f1Status || "PENDING",
            f2Date,
            f2Status: f2Status || "PENDING",
            f3Date,
            f3Status: f3Status || "PENDING",
            assignedToId: userId,
          },
        });
        leadId = newLead.id;

        await prisma.stageHistory.create({
          data: {
            leadId: newLead.id,
            toStage: finalStage,
            changedById: userId,
          },
        });

        result.leadsCreated++;
      }

      // 4. Create Activity records for Outreach Date
      const contactDate = lastContactDate || firstContactDate || (finalStage !== "NEW" ? new Date() : null);

      if (contactDate) {
        const existingAct = await prisma.activity.findFirst({
          where: { leadId },
        });
        if (!existingAct) {
          await prisma.activity.create({
            data: {
              leadId,
              contactId,
              companyId,
              channel: medium === "LinkedIn" ? "LINKEDIN" : "EMAIL",
              activityType: medium === "LinkedIn" ? "CONNECTION_REQUEST" : "EMAIL_SENT",
              direction: "OUTBOUND",
              subject: `Initial Outreach: ${companyName}`,
              message: briefOverview ? `Outreach regarding: ${briefOverview}` : `Outreach via ${medium || "Email"}`,
              outcome: finalOutreachStatus.replace(/_/g, " "),
              date: contactDate,
              createdById: userId,
            },
          });
        }
      }

      // 5. Create FollowUp task if F1 date is set
      const nextDue = f1Date || followUpDate;
      if (nextDue) {
        await prisma.followUp.upsert({
          where: { id: `fu-${leadId}` },
          update: {
            dueDate: nextDue,
            notes: `Follow-up 1 (F1): ${companyName}`,
          },
          create: {
            id: `fu-${leadId}`,
            leadId,
            contactId,
            dueDate: nextDue,
            channel: medium === "LinkedIn" ? "LINKEDIN" : "EMAIL",
            type: "FOLLOW_UP",
            status: "PENDING",
            priority: score >= 80 ? "HIGH" : "MEDIUM",
            notes: `Follow-up 1 (F1): ${companyName}`,
          },
        });
      }
    } catch (error) {
      result.errors.push({
        row: rowNum,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}

/**
 * Auto-detect field mapping matching both India Sheet and UK B2B Sheet structures
 */
export function autoDetectMapping(headers: string[]): Partial<ImportMapping> {
  const mapping: Partial<ImportMapping> = {};
  const headerLower = headers.map((h) => h.toLowerCase().trim().replace(/['"]+/g, ""));

  for (let i = 0; i < headers.length; i++) {
    const h = headerLower[i];
    const original = headers[i];

    if (h.includes("name/company") || h === "company name" || h === "company" || h === "business name") {
      mapping.companyName = original;
    } else if (h.includes("location with country") || h === "location" || h === "city, state" || h === "city") {
      mapping.location = original;
    } else if (h === "country") {
      mapping.country = original;
    } else if (h.includes("founded through") || h.includes("source")) {
      mapping.source = original;
    } else if (h.includes("medium for outreach") || h === "medium" || h === "channel") {
      mapping.medium = original;
    } else if (h.includes("segment")) {
      mapping.segment = original;
    } else if (h === "industry" || h.includes("sub-industry")) {
      mapping.industry = original;
    } else if (h.includes("brief overview") || h.includes("overview") || h.includes("notes") || h.includes("pain points")) {
      mapping.briefOverview = original;
      mapping.notes = original;
    } else if (h === "website" || h === "site") {
      mapping.website = original;
    } else if (h === "linkedin" && i < 12) {
      mapping.linkedinUrl = original; // URL column
    } else if (h === "e-mail" || h === "email" || h === "business email" || h === "contact email") {
      mapping.email = original;
    } else if (h === "contact" || h === "decision maker" || h === "contact name") {
      mapping.decisionMaker = original;
    } else if (h === "job title" || h === "title") {
      mapping.jobTitle = original;
    } else if (h === "phone" || h === "business phone" || h === "business phone number") {
      mapping.phone = original;
    } else if (h === "score" || h === "the score") {
      mapping.score = original;
    } else if (h.includes("outreach date") || h === "first contact date" || h === "initial contact date") {
      mapping.firstContactDate = original;
    } else if (h === "outreach" || h === "outreach status") {
      mapping.outreachStatus = original;
    } else if (h === "f1 date" || h.includes("follow up 1 date")) {
      mapping.f1Date = original;
    } else if (h === "follow up 1" || h === "f1 status") {
      mapping.f1Status = original;
    } else if (h === "f2 date" || h.includes("follow up 2 date")) {
      mapping.f2Date = original;
    } else if (h === "follow up 2" || h === "f2 status") {
      mapping.f2Status = original;
    } else if (h === "f3 date" || h.includes("follow up 3 date")) {
      mapping.f3Date = original;
    } else if (h === "follow up 3" || h === "f3 status") {
      mapping.f3Status = original;
    } else if (h === "status" || h === "lead status" || h === "the lead status") {
      mapping.leadStatus = original;
      if (!mapping.outreachStatus) mapping.outreachStatus = original;
    } else if (h === "email" && i >= 15) {
      mapping.emailStatus = original;
    } else if (h === "linkedin" && i >= 15) {
      mapping.linkedinStatus = original;
    }
  }

  return mapping;
}

/**
 * Fetch and sync directly from a live Google Sheet URL
 */
export async function syncFromGoogleSheetUrl(
  sheetUrl: string,
  userId: string,
  customMapping?: ImportMapping
): Promise<ImportResult> {
  let exportUrl = sheetUrl.trim();

  if (exportUrl.includes("docs.google.com/spreadsheets")) {
    const match = exportUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      const gidMatch = exportUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : "0";
      exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
  }

  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet. Make sure sheet is shared as "Anyone with link can view". Status: ${response.statusText}`);
  }

  const csvText = await response.text();
  const parsed = Papa.parse<ImportRow>(csvText, { header: true, skipEmptyLines: true });

  if (parsed.data.length === 0) {
    throw new Error("Google Sheet returned 0 rows.");
  }

  const headers = parsed.meta.fields || [];
  const mapping = customMapping || (autoDetectMapping(headers) as ImportMapping);

  return importData(parsed.data, mapping, userId);
}
