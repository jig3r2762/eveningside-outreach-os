/**
 * Follow-up Engine
 * Manages outreach sequences, automatic follow-up generation,
 * and due date calculations.
 */

import prisma from "./db";
import { addDays } from "date-fns";

/**
 * Enroll a lead in a sequence
 */
export async function enrollLeadInSequence(
  leadId: string,
  sequenceId: string
) {
  const sequence = await prisma.sequence.findUnique({
    where: { id: sequenceId },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  if (!sequence || sequence.steps.length === 0) {
    throw new Error("Sequence not found or has no steps");
  }

  const now = new Date();
  const firstStep = sequence.steps[0];
  const nextStepDue = addDays(now, firstStep.dayOffset);

  const enrollment = await prisma.leadSequence.upsert({
    where: { leadId },
    update: {
      sequenceId,
      currentStep: 0,
      status: "ACTIVE",
      startedAt: now,
      nextStepDueAt: nextStepDue,
    },
    create: {
      leadId,
      sequenceId,
      currentStep: 0,
      status: "ACTIVE",
      startedAt: now,
      nextStepDueAt: nextStepDue,
    },
  });

  // Create the first follow-up
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { primaryContactId: true },
  });

  await prisma.followUp.create({
    data: {
      leadId,
      contactId: lead?.primaryContactId,
      dueDate: nextStepDue,
      channel: firstStep.channel || sequence.channel,
      type: "FOLLOW_UP",
      status: "PENDING",
      priority: "MEDIUM",
      notes: firstStep.description,
      sequenceStepId: firstStep.id,
    },
  });

  return enrollment;
}

/**
 * Advance a lead to the next step in its sequence
 */
export async function advanceSequence(leadId: string) {
  const enrollment = await prisma.leadSequence.findUnique({
    where: { leadId },
    include: {
      sequence: {
        include: { steps: { orderBy: { stepNumber: "asc" } } },
      },
    },
  });

  if (!enrollment || enrollment.status !== "ACTIVE") {
    return null;
  }

  const nextStepIndex = enrollment.currentStep + 1;
  const steps = enrollment.sequence.steps;

  if (nextStepIndex >= steps.length) {
    // Sequence complete
    await prisma.leadSequence.update({
      where: { leadId },
      data: { status: "COMPLETED" },
    });
    return null;
  }

  const nextStep = steps[nextStepIndex];
  const nextStepDue = addDays(enrollment.startedAt, nextStep.dayOffset);

  await prisma.leadSequence.update({
    where: { leadId },
    data: {
      currentStep: nextStepIndex,
      lastStepAt: new Date(),
      nextStepDueAt: nextStepDue,
    },
  });

  // Create follow-up for next step
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { primaryContactId: true },
  });

  await prisma.followUp.create({
    data: {
      leadId,
      contactId: lead?.primaryContactId,
      dueDate: nextStepDue,
      channel: nextStep.channel || enrollment.sequence.channel,
      type: "FOLLOW_UP",
      status: "PENDING",
      priority: "MEDIUM",
      notes: nextStep.description,
      sequenceStepId: nextStep.id,
    },
  });

  return nextStep;
}

/**
 * Create a follow-up from an activity
 */
export async function createFollowUpFromActivity(
  activityId: string,
  daysFromNow: number,
  options?: {
    channel?: string;
    priority?: string;
    notes?: string;
  }
) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { leadId: true, contactId: true, channel: true },
  });

  if (!activity) {
    throw new Error("Activity not found");
  }

  return prisma.followUp.create({
    data: {
      leadId: activity.leadId,
      contactId: activity.contactId,
      activityId,
      dueDate: addDays(new Date(), daysFromNow),
      channel: options?.channel || activity.channel,
      type: "FOLLOW_UP",
      status: "PENDING",
      priority: options?.priority || "MEDIUM",
      notes: options?.notes,
    },
  });
}

/**
 * Mark overdue follow-ups
 */
export async function markOverdueFollowUps() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return prisma.followUp.updateMany({
    where: {
      dueDate: { lt: now },
      status: "PENDING",
    },
    data: { status: "OVERDUE" },
  });
}

/**
 * Complete a follow-up with outcome
 */
export async function completeFollowUp(
  followUpId: string,
  outcome: string,
  notes?: string
) {
  const followUp = await prisma.followUp.update({
    where: { id: followUpId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      outcome,
      notes,
    },
    include: { lead: true },
  });

  // If lead is enrolled in a sequence, advance it
  if (followUp.leadId) {
    await advanceSequence(followUp.leadId);
  }

  return followUp;
}

/**
 * Cancel pending follow-ups for a lead (e.g., when prospect replies)
 */
export async function cancelPendingFollowUps(leadId: string) {
  return prisma.followUp.updateMany({
    where: {
      leadId,
      status: { in: ["PENDING", "OVERDUE"] },
    },
    data: {
      status: "SKIPPED",
      notes: "Auto-cancelled: prospect responded",
    },
  });
}

/**
 * Get follow-ups due today for a user
 */
export async function getFollowUpsDueToday(userId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.followUp.findMany({
    where: {
      dueDate: { gte: today, lt: tomorrow },
      status: { in: ["PENDING", "OVERDUE"] },
      ...(userId ? { lead: { assignedToId: userId } } : {}),
    },
    include: {
      lead: {
        include: {
          company: { select: { id: true, name: true } },
          primaryContact: { select: { id: true, fullName: true } },
        },
      },
      contact: { select: { id: true, fullName: true } },
    },
    orderBy: { priority: "asc" },
  });
}
