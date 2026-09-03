import prisma from "@/lib/db";

export interface FollowUpCadenceConfig {
  f1Days: number;
  f2Days: number;
  f3Days: number;
  maxFollowUps: number;
  autoSchedule: boolean;
  googleSheetUrl?: string | null;
  autoSyncMinutes?: number;
}

export const DEFAULT_FOLLOWUP_CADENCE: FollowUpCadenceConfig = {
  f1Days: 3,
  f2Days: 7,
  f3Days: 14,
  maxFollowUps: 3,
  autoSchedule: true,
  autoSyncMinutes: 5,
};

/**
 * Get the current follow-up cadence settings
 */
export async function getFollowUpSettings(): Promise<FollowUpCadenceConfig> {
  try {
    const setting = await prisma.followUpSetting.findUnique({
      where: { id: "default" },
    });

    if (setting) {
      return {
        f1Days: setting.f1Days,
        f2Days: setting.f2Days,
        f3Days: setting.f3Days,
        maxFollowUps: setting.maxFollowUps,
        autoSchedule: setting.autoSchedule,
      };
    }
  } catch (e) {
    console.error("Error fetching follow-up settings:", e);
  }

  return DEFAULT_FOLLOWUP_CADENCE;
}

/**
 * Calculate F1, F2, F3 dates based on initial outreach date and configured settings
 */
export function calculateFollowUpDates(
  initialDate: Date,
  config: FollowUpCadenceConfig = DEFAULT_FOLLOWUP_CADENCE
): { f1Date: Date; f2Date: Date; f3Date: Date } {
  const f1Date = new Date(initialDate.getTime() + config.f1Days * 24 * 60 * 60 * 1000);
  const f2Date = new Date(initialDate.getTime() + config.f2Days * 24 * 60 * 60 * 1000);
  const f3Date = new Date(initialDate.getTime() + config.f3Days * 24 * 60 * 60 * 1000);

  return { f1Date, f2Date, f3Date };
}

/**
 * Automatically schedule F1, F2, F3 follow-up reminders for a single lead
 */
export async function scheduleCadenceForLead(
  leadId: string,
  initialDate: Date,
  userId?: string,
  channel: string = "EMAIL"
) {
  const settings = await getFollowUpSettings();
  if (!settings.autoSchedule) return;

  const { f1Date, f2Date, f3Date } = calculateFollowUpDates(initialDate, settings);

  // 1. Update lead record with cadence dates
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      firstContactDate: initialDate,
      f1Date,
      f1Status: "PENDING",
      f2Date,
      f2Status: "PENDING",
      f3Date,
      f3Status: "PENDING",
      followUpDate: f1Date, // Next due is F1
    },
  });

  // 2. Create or update pending FollowUp task for F1
  const existingFollowUp = await prisma.followUp.findFirst({
    where: { leadId, status: "PENDING" },
  });

  if (existingFollowUp) {
    await prisma.followUp.update({
      where: { id: existingFollowUp.id },
      data: { dueDate: f1Date },
    });
  } else {
    await prisma.followUp.create({
      data: {
        leadId,
        dueDate: f1Date,
        channel,
        type: "FOLLOW_UP",
        status: "PENDING",
        priority: "HIGH",
        notes: "Follow-up 1 (F1): Check response after initial outreach",
      },
    });
  }
}

/**
 * Systematically synchronize F1, F2, F3 dates and Follow-Up tasks for ALL leads in database
 */
export async function syncAllLeadsCadence() {
  const settings = await getFollowUpSettings();
  const leads = await prisma.lead.findMany({
    where: {
      firstContactDate: { not: null },
    },
    include: { company: true },
  });

  let updatedCount = 0;

  for (const lead of leads) {
    if (!lead.firstContactDate) continue;

    const initialDate = new Date(lead.firstContactDate);
    const { f1Date, f2Date, f3Date } = calculateFollowUpDates(initialDate, settings);

    // Determine next active follow-up date based on status
    let nextFollowUpDate = f1Date;
    if (lead.f1Status === "SENT" || lead.f1Status === "REPLIED" || lead.f1Status === "NOT_NEEDED") {
      nextFollowUpDate = f2Date;
    }
    if (lead.f2Status === "SENT" || lead.f2Status === "REPLIED" || lead.f2Status === "NOT_NEEDED") {
      nextFollowUpDate = f3Date;
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        f1Date: lead.f1Date || f1Date,
        f1Status: lead.f1Status || "PENDING",
        f2Date: lead.f2Date || f2Date,
        f2Status: lead.f2Status || "PENDING",
        f3Date: lead.f3Date || f3Date,
        f3Status: lead.f3Status || "PENDING",
        followUpDate: nextFollowUpDate,
      },
    });

    // Ensure a pending FollowUp task exists for this lead
    const existingFollowUp = await prisma.followUp.findFirst({
      where: { leadId: lead.id, status: "PENDING" },
    });

    if (existingFollowUp) {
      await prisma.followUp.update({
        where: { id: existingFollowUp.id },
        data: { dueDate: nextFollowUpDate },
      });
    } else if (lead.stage !== "WON" && lead.stage !== "LOST") {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          contactId: lead.primaryContactId,
          dueDate: nextFollowUpDate,
          channel: lead.medium || "EMAIL",
          type: "FOLLOW_UP",
          status: "PENDING",
          priority: lead.leadScore >= 80 ? "HIGH" : "MEDIUM",
          notes: `Follow-up on ${lead.company?.name || "prospect"}`,
        },
      });
    }

    updatedCount++;
  }

  return { totalSynced: updatedCount };
}
