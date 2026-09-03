/**
 * Client Conversion Logic
 * When an opportunity becomes WON:
 * - Converts into a Client record
 * - Retains full company, contact, deal value, service, source, and salesperson history
 */

import prisma from "./db";

export async function convertOpportunityToClient(opportunityId: string, userId?: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      company: true,
      contact: true,
      lead: true,
      opportunityServices: true,
    },
  });

  if (!opportunity) {
    throw new Error("Opportunity not found");
  }

  // Update opportunity stage
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      stage: "WON",
      probability: 100,
    },
  });

  // Update associated lead stage to WON if exists
  if (opportunity.leadId) {
    await prisma.lead.update({
      where: { id: opportunity.leadId },
      data: { stage: "WON" },
    });

    await prisma.stageHistory.create({
      data: {
        leadId: opportunity.leadId,
        toStage: "WON",
        changedById: userId || opportunity.ownerId,
      },
    });
  }

  // Primary service if any
  const primaryServiceId = opportunity.opportunityServices[0]?.serviceId || null;

  // Create Client record preserving sales history
  const client = await prisma.client.upsert({
    where: { opportunityId: opportunity.id },
    update: {
      dealValue: opportunity.estimatedValue,
      serviceId: primaryServiceId,
      source: opportunity.lead?.source || "Outbound",
      salespersonId: opportunity.ownerId || userId,
      notes: opportunity.notes,
    },
    create: {
      companyId: opportunity.companyId,
      opportunityId: opportunity.id,
      dealValue: opportunity.estimatedValue,
      serviceId: primaryServiceId,
      source: opportunity.lead?.source || "Outbound",
      salespersonId: opportunity.ownerId || userId,
      notes: opportunity.notes,
      convertedAt: new Date(),
    },
  });

  return client;
}
