import prisma from "@/lib/db";
import { logAuditEvent } from "./audit";

type TriggerEvent = "ON_REPLY" | "ON_MEETING_BOOKED" | "ON_OPPORTUNITY_WON" | "ON_BOUNCE";

export async function executeAutomationTrigger(
  triggerEvent: TriggerEvent,
  payload: { leadId?: string; companyId?: string; contactId?: string; activityId?: string; opportunityId?: string }
) {
  try {
    switch (triggerEvent) {
      case "ON_REPLY":
        if (payload.leadId) {
          await prisma.lead.update({
            where: { id: payload.leadId },
            data: { stage: "CONVERSATION", outreachStatus: "REPLIED" },
          });
          await logAuditEvent({
            action: "AUTOMATION_STAGE_CHANGE",
            entityType: "Lead",
            entityId: payload.leadId,
            newValues: { stage: "CONVERSATION" },
            source: "AI_AUTOMATION",
          });
        }
        break;
      case "ON_MEETING_BOOKED":
        if (payload.leadId) {
          await prisma.lead.update({
            where: { id: payload.leadId },
            data: { stage: "DISCOVERY_CALL", outreachStatus: "MEETING_BOOKED" },
          });
          await logAuditEvent({
            action: "AUTOMATION_MEETING_BOOKED",
            entityType: "Lead",
            entityId: payload.leadId,
            newValues: { stage: "DISCOVERY_CALL" },
            source: "AI_AUTOMATION",
          });
        }
        break;
      case "ON_OPPORTUNITY_WON":
        if (payload.opportunityId) {
          const opp = await prisma.opportunity.update({
            where: { id: payload.opportunityId },
            data: { stage: "WON" },
            include: { company: true },
          });
          // Auto create client record if not exists
          const existingClient = await prisma.client.findFirst({
            where: { opportunityId: payload.opportunityId },
          });
          if (!existingClient) {
            const client = await prisma.client.create({
              data: {
                companyId: opp.companyId,
                opportunityId: opp.id,
                dealValue: opp.estimatedValue,
                salespersonId: opp.ownerId,
                status: "ONBOARDING",
              },
            });
            await prisma.clientOnboarding.create({
              data: {
                clientId: client.id,
                status: "IN_PROGRESS",
                checklist: JSON.stringify([
                  { task: "Execute Master Services Agreement (MSA)", completed: false },
                  { task: "Set up project Slack / communication channel", completed: false },
                  { task: "Schedule Technical Kickoff Call", completed: false },
                  { task: "Gather API credentials and system access", completed: false },
                ]),
              },
            });
          }
        }
        break;
      case "ON_BOUNCE":
        if (payload.contactId) {
          const contact = await prisma.contact.update({
            where: { id: payload.contactId },
            data: { status: "BOUNCED", verificationStatus: "INVALID" },
          });
          if (contact.email) {
            await prisma.suppressionList.upsert({
              where: { value: contact.email },
              update: { reason: "BOUNCED" },
              create: {
                type: "EMAIL",
                value: contact.email,
                reason: "BOUNCED",
                notes: `Auto-suppressed via bounce trigger for contact ${contact.fullName}`,
              },
            });
          }
        }
        break;
    }
  } catch (error) {
    console.error(`Error executing automation for ${triggerEvent}:`, error);
  }
}
