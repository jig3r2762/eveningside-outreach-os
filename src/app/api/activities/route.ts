import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    const json = await req.json();
    const {
      leadId,
      companyId: reqCompanyId,
      contactId: reqContactId,
      channel,
      activityType,
      direction = "OUTBOUND",
      subject,
      message,
      outcome = "Sent",
      nextFollowUpDate,
      notes,
    } = json;

    let companyId = reqCompanyId;
    let contactId = reqContactId;

    if (leadId && (!companyId || !contactId)) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { companyId: true, primaryContactId: true },
      });
      if (lead) {
        if (!companyId) companyId = lead.companyId;
        if (!contactId) contactId = lead.primaryContactId;
      }
    }

    const now = new Date();

    // 1. Create the Activity record
    const activity = await prisma.activity.create({
      data: {
        leadId,
        companyId,
        contactId,
        channel: channel || "EMAIL",
        activityType: activityType || "EMAIL_SENT",
        direction,
        subject,
        message,
        outcome,
        date: now,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined,
        notes,
        createdById: userId,
      },
    });

    // 2. Automatically Update Lead Stage and Dates
    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (lead) {
        let newStage = lead.stage;
        let newOutreachStatus = lead.outreachStatus;

        if (["NEW", "READY_TO_CONTACT", "RESEARCHING", "QUALIFIED"].includes(lead.stage)) {
          newStage = activityType === "CONNECTION_REQUEST" ? "CONTACTED" : "CONTACTED";
        }

        if (activityType === "CONNECTION_REQUEST") {
          newOutreachStatus = "REQUEST_SENT";
        } else if (["EMAIL_SENT", "FIRST_MESSAGE", "FOLLOW_UP"].includes(activityType) || channel === "EMAIL") {
          newOutreachStatus = "MESSAGE_SENT";
        } else if (outcome?.toLowerCase().includes("accept")) {
          newStage = "CONNECTED";
          newOutreachStatus = "ACCEPTED";
        } else if (outcome?.toLowerCase().includes("repli")) {
          newStage = "CONVERSATION";
          newOutreachStatus = "REPLIED";
        }

        await prisma.lead.update({
          where: { id: leadId },
          data: {
            stage: newStage,
            outreachStatus: newOutreachStatus,
            firstContactDate: lead.firstContactDate || now,
            lastContactDate: now,
          },
        });
      }
    }

    // 3. Update Contact Dates
    if (contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      if (contact) {
        await prisma.contact.update({
          where: { id: contactId },
          data: {
            firstContactDate: contact.firstContactDate || now,
            lastContacted: now,
            outreachStatus: "MESSAGE_SENT",
          },
        });
      }
    }

    // 4. Create FollowUp task (default 3 days from now if not specified)
    const dueDate = nextFollowUpDate
      ? new Date(nextFollowUpDate)
      : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (leadId) {
      await prisma.followUp.create({
        data: {
          leadId,
          contactId,
          activityId: activity.id,
          dueDate,
          channel: channel || "EMAIL",
          type: "FOLLOW_UP",
          status: "PENDING",
          priority: "HIGH",
          notes: subject ? `Follow up on: ${subject}` : "Scheduled outreach follow-up",
        },
      });
    }

    return NextResponse.json({ activity, success: true });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
