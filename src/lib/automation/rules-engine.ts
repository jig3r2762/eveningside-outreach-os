/**
 * Automation Rules Engine
 * Event-driven automation per spec Section 19.
 */

import prisma from "../db";
import { addDays } from "date-fns";

export type AutomationEvent =
  | "LEAD_CREATED"
  | "RESEARCH_COMPLETED"
  | "LINKEDIN_REQUEST_SENT"
  | "CONNECTION_ACCEPTED"
  | "MESSAGE_SENT"
  | "FOLLOW_UP_DUE"
  | "PROSPECT_REPLIED"
  | "MEETING_BOOKED"
  | "PROPOSAL_SENT"
  | "LEAD_INACTIVE"
  | "LEAD_LOST";

interface EventPayload {
  leadId?: string;
  contactId?: string;
  companyId?: string;
  userId?: string;
  activityId?: string;
  data?: Record<string, unknown>;
}

/**
 * Process automation rules based on events
 */
export async function processAutomation(
  event: AutomationEvent,
  payload: EventPayload
) {
  const results: string[] = [];

  switch (event) {
    // Rule 1: New lead created → assign owner → create research task
    case "LEAD_CREATED": {
      if (payload.leadId && payload.userId) {
        // Assign owner
        await prisma.lead.update({
          where: { id: payload.leadId },
          data: { assignedToId: payload.userId },
        });

        // Create research task
        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
          include: { company: true },
        });

        if (lead) {
          await prisma.task.create({
            data: {
              title: `Research ${lead.company.name}`,
              description: `Complete research profile for ${lead.company.name}. Look for operational complexity, pain signals, and buying signals.`,
              leadId: payload.leadId,
              companyId: lead.companyId,
              priority: "MEDIUM",
              status: "PENDING",
              assignedToId: payload.userId,
              createdById: payload.userId,
              dueDate: addDays(new Date(), 1),
            },
          });
          results.push("Created research task");
        }
      }
      break;
    }

    // Rule 2: Research completed → calculate qualification → move stage
    case "RESEARCH_COMPLETED": {
      if (payload.leadId) {
        // Import dynamically to avoid circular deps
        const { calculateQualification } = await import("../qualification");

        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
        });

        if (lead) {
          const score = await calculateQualification({
            leadId: payload.leadId,
            companyId: lead.companyId,
          });

          // If qualified (score >= 50), move to QUALIFIED stage
          if (score.totalScore >= 50 && lead.stage === "RESEARCHING") {
            await prisma.lead.update({
              where: { id: payload.leadId },
              data: { stage: "QUALIFIED" },
            });

            await prisma.stageHistory.create({
              data: {
                leadId: payload.leadId,
                fromStage: "RESEARCHING",
                toStage: "QUALIFIED",
                changedById: payload.userId,
              },
            });

            results.push(`Lead qualified with score ${score.totalScore}`);

            // If score >= 65, move to READY_TO_CONTACT
            if (score.totalScore >= 65) {
              await prisma.lead.update({
                where: { id: payload.leadId },
                data: { stage: "READY_TO_CONTACT" },
              });

              await prisma.stageHistory.create({
                data: {
                  leadId: payload.leadId,
                  fromStage: "QUALIFIED",
                  toStage: "READY_TO_CONTACT",
                  changedById: payload.userId,
                },
              });

              results.push("Lead moved to Ready to Contact");
            }
          }
        }
      }
      break;
    }

    // Rule 3: LinkedIn request sent → create waiting task
    case "LINKEDIN_REQUEST_SENT": {
      if (payload.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
          include: {
            company: true,
            primaryContact: true,
          },
        });

        if (lead) {
          await prisma.task.create({
            data: {
              title: `Wait for LinkedIn acceptance — ${lead.primaryContact?.fullName || "Contact"}`,
              description: `LinkedIn connection request sent to ${lead.primaryContact?.fullName} at ${lead.company.name}. Check in 3 days if not accepted.`,
              leadId: payload.leadId,
              contactId: lead.primaryContactId || undefined,
              companyId: lead.companyId,
              channel: "LINKEDIN",
              priority: "LOW",
              status: "PENDING",
              assignedToId: lead.assignedToId || payload.userId,
              createdById: payload.userId,
              dueDate: addDays(new Date(), 3),
            },
          });
          results.push("Created LinkedIn waiting task");
        }
      }
      break;
    }

    // Rule 4: Connection accepted → create "Send First Message" task
    case "CONNECTION_ACCEPTED": {
      if (payload.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
          include: {
            company: true,
            primaryContact: true,
          },
        });

        if (lead) {
          // Update stage
          if (["CONTACTED", "READY_TO_CONTACT"].includes(lead.stage)) {
            await prisma.lead.update({
              where: { id: payload.leadId },
              data: { stage: "CONNECTED" },
            });

            await prisma.stageHistory.create({
              data: {
                leadId: payload.leadId,
                fromStage: lead.stage,
                toStage: "CONNECTED",
                changedById: payload.userId,
              },
            });
          }

          await prisma.task.create({
            data: {
              title: `Send first LinkedIn message to ${lead.primaryContact?.fullName || "Contact"}`,
              description: `LinkedIn connection accepted by ${lead.primaryContact?.fullName} at ${lead.company.name}. Send personalized first message.`,
              leadId: payload.leadId,
              contactId: lead.primaryContactId || undefined,
              companyId: lead.companyId,
              channel: "LINKEDIN",
              priority: "HIGH",
              status: "PENDING",
              assignedToId: lead.assignedToId || payload.userId,
              createdById: payload.userId,
              dueDate: new Date(), // Today
            },
          });
          results.push("Created 'Send First Message' task");
        }
      }
      break;
    }

    // Rule 5: Message sent → calculate next follow-up
    case "MESSAGE_SENT": {
      if (payload.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
        });

        if (lead) {
          // Create follow-up in 3 days
          await prisma.followUp.create({
            data: {
              leadId: payload.leadId,
              contactId: payload.contactId,
              activityId: payload.activityId,
              dueDate: addDays(new Date(), 3),
              channel: payload.data?.channel as string || "LINKEDIN",
              type: "FOLLOW_UP",
              status: "PENDING",
              priority: "MEDIUM",
              notes: "Follow up on message sent",
            },
          });
          results.push("Created 3-day follow-up");
        }
      }
      break;
    }

    // Rule 7: Prospect replies → remove pending follow-up → create response task
    case "PROSPECT_REPLIED": {
      if (payload.leadId) {
        // Cancel pending follow-ups
        await prisma.followUp.updateMany({
          where: {
            leadId: payload.leadId,
            status: { in: ["PENDING", "OVERDUE"] },
          },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            outcome: "Prospect replied",
          },
        });

        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
          include: {
            company: true,
            primaryContact: true,
          },
        });

        if (lead) {
          // Update stage to CONVERSATION
          if (!["CONVERSATION", "DISCOVERY_CALL", "QUALIFIED_OPPORTUNITY", "PROPOSAL", "NEGOTIATION", "WON"].includes(lead.stage)) {
            await prisma.lead.update({
              where: { id: payload.leadId },
              data: { stage: "CONVERSATION" },
            });

            await prisma.stageHistory.create({
              data: {
                leadId: payload.leadId,
                fromStage: lead.stage,
                toStage: "CONVERSATION",
                changedById: payload.userId,
              },
            });
          }

          // Create response task
          await prisma.task.create({
            data: {
              title: `Respond to ${lead.primaryContact?.fullName || "Contact"} — ${lead.company.name}`,
              description: `${lead.primaryContact?.fullName} at ${lead.company.name} has replied. Review their message and respond appropriately.`,
              leadId: payload.leadId,
              contactId: lead.primaryContactId || undefined,
              companyId: lead.companyId,
              priority: "HIGH",
              status: "PENDING",
              assignedToId: lead.assignedToId || payload.userId,
              createdById: payload.userId,
              dueDate: new Date(), // Today - urgent
            },
          });
          results.push("Cancelled pending follow-ups, created response task");
        }
      }
      break;
    }

    // Rule 8: Meeting booked → move to Discovery Call
    case "MEETING_BOOKED": {
      if (payload.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
        });

        if (lead && !["DISCOVERY_CALL", "QUALIFIED_OPPORTUNITY", "PROPOSAL", "NEGOTIATION", "WON"].includes(lead.stage)) {
          await prisma.lead.update({
            where: { id: payload.leadId },
            data: { stage: "DISCOVERY_CALL" },
          });

          await prisma.stageHistory.create({
            data: {
              leadId: payload.leadId,
              fromStage: lead.stage,
              toStage: "DISCOVERY_CALL",
              changedById: payload.userId,
            },
          });
          results.push("Lead moved to Discovery Call");
        }
      }
      break;
    }

    // Rule 9: Proposal sent → create proposal follow-up
    case "PROPOSAL_SENT": {
      if (payload.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
          include: { company: true, primaryContact: true },
        });

        if (lead) {
          await prisma.lead.update({
            where: { id: payload.leadId },
            data: { stage: "PROPOSAL" },
          });

          await prisma.stageHistory.create({
            data: {
              leadId: payload.leadId,
              fromStage: lead.stage,
              toStage: "PROPOSAL",
              changedById: payload.userId,
            },
          });

          await prisma.followUp.create({
            data: {
              leadId: payload.leadId,
              contactId: lead.primaryContactId,
              dueDate: addDays(new Date(), 5),
              type: "PROPOSAL_FOLLOW_UP",
              status: "PENDING",
              priority: "HIGH",
              notes: `Follow up on proposal sent to ${lead.company.name}`,
            },
          });
          results.push("Created proposal follow-up");
        }
      }
      break;
    }

    // Rule 11: Lead marked Lost → require lost reason (handled at API level)
    case "LEAD_LOST": {
      if (payload.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: payload.leadId },
        });

        if (lead) {
          // Cancel all pending follow-ups and tasks
          await prisma.followUp.updateMany({
            where: {
              leadId: payload.leadId,
              status: { in: ["PENDING", "OVERDUE"] },
            },
            data: { status: "SKIPPED" },
          });

          await prisma.task.updateMany({
            where: {
              leadId: payload.leadId,
              status: { in: ["PENDING", "IN_PROGRESS"] },
            },
            data: { status: "SKIPPED" },
          });

          // Cancel sequence
          await prisma.leadSequence.updateMany({
            where: { leadId: payload.leadId, status: "ACTIVE" },
            data: { status: "CANCELLED" },
          });

          results.push("Cancelled all pending follow-ups and tasks");
        }
      }
      break;
    }
  }

  return results;
}

/**
 * Rule 10: Check for leads going cold (no activity for N days)
 */
export async function checkGoingCold(days: number = 14) {
  const cutoff = addDays(new Date(), -days);

  // Find leads with no recent activity that aren't in terminal states
  const coldLeads = await prisma.lead.findMany({
    where: {
      stage: {
        notIn: ["WON", "LOST", "NURTURE", "NEW"],
      },
      updatedAt: { lt: cutoff },
      activities: {
        none: {
          createdAt: { gte: cutoff },
        },
      },
    },
    include: {
      company: { select: { name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  // Create notifications for each cold lead
  for (const lead of coldLeads) {
    if (lead.assignedToId) {
      await prisma.notification.create({
        data: {
          userId: lead.assignedToId,
          type: "LEAD_GOING_COLD",
          title: `${lead.company.name} going cold`,
          message: `No activity in ${days}+ days. Consider following up or moving to Nurture.`,
          relatedLeadId: lead.id,
        },
      });
    }
  }

  return coldLeads;
}
