import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Leads by Country
    const companies = await prisma.company.findMany({
      select: { country: true, industry: true, leadScore: true },
    });

    const leadsByCountryMap: Record<string, number> = {};
    const leadsByIndustryMap: Record<string, number> = {};

    companies.forEach((c) => {
      const country = c.country || "Unknown";
      leadsByCountryMap[country] = (leadsByCountryMap[country] || 0) + 1;

      const industry = c.industry || "Other";
      leadsByIndustryMap[industry] = (leadsByIndustryMap[industry] || 0) + 1;
    });

    const leadsByCountry = Object.entries(leadsByCountryMap).map(([name, count]) => ({
      name,
      count,
    }));
    const leadsByIndustry = Object.entries(leadsByIndustryMap).map(([name, count]) => ({
      name,
      count,
    }));

    // 2. Outreach conversion funnel
    const activities = await prisma.activity.findMany({
      select: { channel: true, activityType: true, direction: true },
    });

    const connectionRequests = activities.filter(
      (a) => a.activityType === "CONNECTION_REQUEST"
    ).length;
    const connectionAccepted = activities.filter(
      (a) => a.activityType === "CONNECTION_ACCEPTED"
    ).length;
    const messagesSent = activities.filter(
      (a) => ["FIRST_MESSAGE", "FOLLOW_UP", "EMAIL_SENT"].includes(a.activityType)
    ).length;
    const repliesReceived = activities.filter(
      (a) => ["EMAIL_REPLY", "CALL_CONNECTED"].includes(a.activityType) || a.direction === "INBOUND"
    ).length;
    const meetingsBooked = activities.filter((a) => a.activityType === "MEETING").length;
    const proposalsSent = activities.filter((a) => a.activityType === "PROPOSAL").length;
    const wonCount = await prisma.client.count();

    const funnel = [
      { stage: "Connection Requests", count: connectionRequests },
      { stage: "Connections Accepted", count: connectionAccepted },
      { stage: "Messages Sent", count: messagesSent },
      { stage: "Replies Received", count: repliesReceived },
      { stage: "Meetings Booked", count: meetingsBooked },
      { stage: "Proposals Sent", count: proposalsSent },
      { stage: "Won Clients", count: wonCount },
    ];

    // 3. Channel breakdown
    const channelMap: Record<string, number> = {};
    activities.forEach((a) => {
      channelMap[a.channel] = (channelMap[a.channel] || 0) + 1;
    });
    const activityByChannel = Object.entries(channelMap).map(([channel, count]) => ({
      channel,
      count,
    }));

    // 4. Revenue & Pipeline
    const clients = await prisma.client.findMany({
      include: { company: true },
    });
    const totalWonRevenue = clients.reduce((sum, c) => sum + c.dealValue, 0);

    const revenueByMarketMap: Record<string, number> = {};
    clients.forEach((c) => {
      const market = c.company.country || "Other";
      revenueByMarketMap[market] = (revenueByMarketMap[market] || 0) + c.dealValue;
    });
    const revenueByMarket = Object.entries(revenueByMarketMap).map(([market, value]) => ({
      market,
      value,
    }));

    return NextResponse.json({
      leadsByCountry,
      leadsByIndustry,
      funnel,
      activityByChannel,
      totalWonRevenue,
      revenueByMarket,
      rates: {
        acceptanceRate: connectionRequests ? Math.round((connectionAccepted / connectionRequests) * 100) : 0,
        replyRate: messagesSent ? Math.round((repliesReceived / messagesSent) * 100) : 0,
        meetingRate: repliesReceived ? Math.round((meetingsBooked / repliesReceived) * 100) : 0,
        winRate: proposalsSent ? Math.round((wonCount / proposalsSent) * 100) : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
