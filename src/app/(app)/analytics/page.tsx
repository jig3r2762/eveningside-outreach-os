"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users, DollarSign, Target, CheckCircle2, Send, MessageSquare } from "lucide-react";

const COLORS = ["#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B"];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load analytics", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading sales analytics...</div>;
  }

  const { leadsByCountry, leadsByIndustry, funnel, activityByChannel, rates, totalWonRevenue, revenueByMarket } =
    data || {
      leadsByCountry: [],
      leadsByIndustry: [],
      funnel: [],
      activityByChannel: [],
      rates: { acceptanceRate: 0, replyRate: 0, meetingRate: 0, winRate: 0 },
      totalWonRevenue: 0,
      revenueByMarket: [],
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Outreach Analytics & Conversion</h1>
        <p className="text-sm text-gray-500">
          Understand which outreach channels, geographic markets, and industries actually produce meetings and clients.
        </p>
      </div>

      {/* Key Rates Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500">Connection Acceptance Rate</p>
          <p className="text-2xl font-bold text-blue-600">{rates.acceptanceRate}%</p>
          <p className="text-[11px] text-gray-400 mt-1">LinkedIn connections</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500">Outreach Reply Rate</p>
          <p className="text-2xl font-bold text-indigo-600">{rates.replyRate}%</p>
          <p className="text-[11px] text-gray-400 mt-1">Replies per message sent</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500">Reply-to-Meeting Rate</p>
          <p className="text-2xl font-bold text-amber-600">{rates.meetingRate}%</p>
          <p className="text-[11px] text-gray-400 mt-1">Meetings booked from replies</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500">Proposal Win Rate</p>
          <p className="text-2xl font-bold text-green-600">{rates.winRate}%</p>
          <p className="text-[11px] text-gray-400 mt-1">Closed deals per proposal</p>
        </Card>
      </div>

      {/* Funnel and Channels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Pipeline Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Outreach Conversion Funnel</CardTitle>
            <CardDescription className="text-xs">
              From first connection touchpoint to won project engagement
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity by Channel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Touchpoints by Channel</CardTitle>
            <CardDescription className="text-xs">
              Distribution of outbound actions across LinkedIn, Email, Calls, WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            {activityByChannel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityByChannel}
                    dataKey="count"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }: any) => `${name}: ${value}`}
                  >
                    {activityByChannel.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400">No activity logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geographic and Market Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Leads by Target Country</CardTitle>
            <CardDescription className="text-xs">Geographic concentration of prospects</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByCountry}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Leads by Industry Vertical</CardTitle>
            <CardDescription className="text-xs">Industry breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByIndustry}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
