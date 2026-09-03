import { auth } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Flame,
  Snowflake,
  Sparkles,
  Target,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime, formatDate, getScoreColor, stageLabel } from "@/lib/utils";
import { GoogleSheetSyncModal } from "@/components/google-sheet-sync-modal";
import { GmailSyncModal } from "@/components/gmail-sync-modal";
import { WhatShouldIDo } from "@/components/what-should-i-do";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "SALES_MANAGER";

  // Date boundaries
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Filters for role scoping
  const leadFilter = isAdmin ? {} : { assignedToId: userId };
  const followUpFilter = isAdmin ? {} : { lead: { assignedToId: userId } };
  const taskFilter = isAdmin ? {} : { assignedToId: userId };
  const oppFilter = isAdmin ? {} : { ownerId: userId };

  // Single concurrent Promise.all batch query
  const [
    totalLeads,
    qualifiedLeads,
    contactedLeads,
    awaitingResponseLeads,
    followUpsDueTodayCount,
    overdueFollowUpsCount,
    meetingsBooked,
    proposalsSent,
    wonLeads,
    lostLeads,
    pipelineOpportunities,
    followUpsDueToday,
    overdueFollowUps,
    tasksDueToday,
    hotLeads,
    recentlyActiveLeads,
    goingColdLeads,
    overdueLeads,
  ] = await Promise.all([
    db.lead.count({ where: leadFilter }),
    db.lead.count({ where: { ...leadFilter, leadScore: { gte: 80 } } }),
    db.lead.count({ where: { ...leadFilter, stage: { in: ["CONTACTED", "CONNECTED", "CONVERSATION"] } } }),
    db.lead.count({ where: { ...leadFilter, stage: "CONTACTED" } }),
    db.followUp.count({
      where: {
        dueDate: { gte: startOfToday, lte: endOfToday },
        status: "PENDING",
        ...followUpFilter,
      },
    }),
    db.followUp.count({
      where: {
        dueDate: { lt: startOfToday },
        status: "PENDING",
        ...followUpFilter,
      },
    }),
    db.lead.count({ where: { ...leadFilter, stage: "DISCOVERY_CALL" } }),
    db.lead.count({ where: { ...leadFilter, stage: "PROPOSAL" } }),
    db.lead.count({ where: { ...leadFilter, stage: "WON" } }),
    db.lead.count({ where: { ...leadFilter, stage: "LOST" } }),
    db.opportunity.findMany({
      where: {
        stage: { notIn: ["WON", "LOST"] },
        ...oppFilter,
      },
      select: { estimatedValue: true, probability: true },
    }),
    db.followUp.findMany({
      where: {
        dueDate: { gte: startOfToday, lte: endOfToday },
        status: "PENDING",
        ...followUpFilter,
      },
      include: { lead: { include: { company: true } }, contact: true },
      orderBy: { dueDate: "asc" },
      take: 15,
    }),
    db.followUp.findMany({
      where: {
        dueDate: { lt: startOfToday },
        status: "PENDING",
        ...followUpFilter,
      },
      include: { lead: { include: { company: true } }, contact: true },
      orderBy: { dueDate: "asc" },
      take: 15,
    }),
    db.task.findMany({
      where: {
        dueDate: { gte: startOfToday, lte: endOfToday },
        status: "PENDING",
        ...taskFilter,
      },
      include: { lead: { include: { company: true } }, contact: true, company: true },
      orderBy: { dueDate: "asc" },
      take: 15,
    }),
    db.lead.findMany({
      where: {
        ...leadFilter,
        leadScore: { gte: 80 },
        stage: { notIn: ["WON", "LOST"] },
      },
      include: { company: true, primaryContact: true },
      orderBy: { leadScore: "desc" },
      take: 6,
    }),
    db.lead.findMany({
      where: {
        ...leadFilter,
        activities: { some: { date: { gte: threeDaysAgo } } },
      },
      include: { company: true, primaryContact: true },
      take: 6,
    }),
    db.lead.findMany({
      where: {
        ...leadFilter,
        updatedAt: { lt: fourteenDaysAgo },
        stage: { notIn: ["WON", "LOST", "NURTURE"] },
      },
      include: { company: true, primaryContact: true },
      take: 6,
    }),
    db.lead.findMany({
      where: {
        ...leadFilter,
        followUps: { some: { dueDate: { lt: startOfToday }, status: "PENDING" } },
      },
      include: { company: true, primaryContact: true },
      take: 6,
    }),
  ]);

  const pipelineValue = pipelineOpportunities.reduce(
    (acc, opp) => acc + (opp.estimatedValue * opp.probability) / 100,
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Today&apos;s Outreach Command
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
              Live Executive Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time conversion metrics, high-velocity follow-up cadence, and automated smart queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GoogleSheetSyncModal />
          <GmailSyncModal />
          <WhatShouldIDo />
          <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs gap-1 shadow-xs">
            <Link href="/leads" prefetch={true}>
              <Plus className="h-3.5 w-3.5" /> All Leads
            </Link>
          </Button>
        </div>
      </div>

      {/* 1. High-Density Executive Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Total Leads */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f121a] p-3 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Leads</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalLeads}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Active Relationship DB</div>
        </div>

        {/* Qualified Leads */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f121a] p-3 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Qualified Leads</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{qualifiedLeads}</div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">ICP Fit Target</div>
        </div>

        {/* Due Today */}
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-3 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
            <Clock className="h-3 w-3" /> Due Today
          </div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-1">{followUpsDueTodayCount}</div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Scheduled Cadence</div>
        </div>

        {/* Overdue Follow-ups */}
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3 shadow-2xs">
          <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Overdue Follow-ups
          </div>
          <div className="text-2xl font-bold text-rose-800 dark:text-rose-300 mt-1">{overdueFollowUpsCount}</div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">Immediate Action Req.</div>
        </div>

        {/* Won Deals */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Won Deals
          </div>
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">{wonLeads}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Converted Clients</div>
        </div>

        {/* Weighted Pipeline */}
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/30 p-3 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Weighted Pipeline
          </div>
          <div className="text-xl font-bold text-indigo-900 dark:text-indigo-200 mt-1 truncate">
            ${Math.round(pipelineValue).toLocaleString()}
          </div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">Forecasted Deals</div>
        </div>
      </div>

      {/* 2. Today's Action Queue (Overdue, Due Today, Tasks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Overdue Queue */}
        <div className="rounded-xl border border-rose-200/90 dark:border-rose-950/60 bg-white dark:bg-[#0f121a] p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-950/40">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Overdue Follow-ups</h2>
              <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-mono font-bold">
                {overdueFollowUps.length}
              </span>
            </div>
            <Link href="/follow-ups" prefetch={true} className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <ScrollArea className="h-[280px] mt-2">
            <div className="space-y-2.5 pr-2">
              {overdueFollowUps.map((fu) => (
                <div key={fu.id} className="p-2.5 rounded-lg border border-slate-200/70 dark:border-[#222736] bg-slate-50/70 dark:bg-[#151923] hover:bg-slate-100/70 dark:hover:bg-[#1a202e] transition-colors flex items-center justify-between">
                  <div className="truncate pr-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {fu.lead?.company?.name || "Company"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {fu.contact?.fullName || "Decision Maker"} • <span className="text-rose-600 dark:text-rose-400 font-medium">Due {formatRelativeTime(fu.dueDate)}</span>
                    </div>
                  </div>
                  {fu.leadId && (
                    <Button size="sm" variant="outline" className="h-7 text-[11px] border-rose-200 dark:border-rose-800/50 bg-white dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/50" asChild>
                      <Link href={`/leads/${fu.leadId}`} prefetch={true}>Action</Link>
                    </Button>
                  )}
                </div>
              ))}
              {overdueFollowUps.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">All follow-ups up to date! 🎉</div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Due Today Queue */}
        <div className="rounded-xl border border-blue-200/90 dark:border-blue-950/60 bg-white dark:bg-[#0f121a] p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-blue-950/40">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Due Today</h2>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-bold">
                {followUpsDueToday.length}
              </span>
            </div>
            <Link href="/follow-ups" prefetch={true} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <ScrollArea className="h-[280px] mt-2">
            <div className="space-y-2.5 pr-2">
              {followUpsDueToday.map((fu) => (
                <div key={fu.id} className="p-2.5 rounded-lg border border-slate-200/70 dark:border-[#222736] bg-slate-50/70 dark:bg-[#151923] hover:bg-slate-100/70 dark:hover:bg-[#1a202e] transition-colors flex items-center justify-between">
                  <div className="truncate pr-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {fu.lead?.company?.name || "Company"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {fu.contact?.fullName || "Decision Maker"} • <span className="text-blue-600 dark:text-blue-400 font-medium font-mono">{fu.channel || "EMAIL"}</span>
                    </div>
                  </div>
                  {fu.leadId && (
                    <Button size="sm" variant="outline" className="h-7 text-[11px] border-blue-200 dark:border-blue-800/50 bg-white dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50" asChild>
                      <Link href={`/leads/${fu.leadId}`} prefetch={true}>Engage</Link>
                    </Button>
                  )}
                </div>
              ))}
              {followUpsDueToday.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No more follow-ups scheduled for today.</div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Tasks Queue */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f121a] p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Today&apos;s Tasks</h2>
              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-[10px] font-mono font-bold">
                {tasksDueToday.length}
              </span>
            </div>
            <Link href="/tasks" prefetch={true} className="text-xs text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-0.5">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <ScrollArea className="h-[280px] mt-2">
            <div className="space-y-2.5 pr-2">
              {tasksDueToday.map((t) => (
                <div key={t.id} className="p-2.5 rounded-lg border border-slate-200/70 dark:border-[#222736] bg-slate-50/70 dark:bg-[#151923] hover:bg-slate-100/70 dark:hover:bg-[#1a202e] transition-colors flex items-center justify-between">
                  <div className="truncate pr-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{t.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {t.company?.name || "General"} {t.contact && `• ${t.contact.fullName}`}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] dark:hover:bg-slate-800" asChild>
                    <Link href={t.leadId ? `/leads/${t.leadId}` : `/tasks`} prefetch={true}>Open</Link>
                  </Button>
                </div>
              ))}
              {tasksDueToday.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No pending tasks for today.</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 3. High-Conversion Smart Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hot Leads */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f121a] p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Hot Prospects</span>
            </div>
            <span className="text-[10px] font-mono text-orange-700 dark:text-orange-300 font-bold bg-orange-50 dark:bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800/50">
              Score ≥ 80
            </span>
          </div>

          <div className="space-y-2">
            {hotLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                <div className="truncate pr-2">
                  <Link href={`/leads/${l.id}`} prefetch={true} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block">
                    {l.company.name}
                  </Link>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{l.primaryContact?.fullName || "Primary Contact"}</span>
                </div>
                <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${getScoreColor(l.leadScore)}`}>
                  {l.leadScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Active */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f121a] p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Recently Active</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50">
              3 Days
            </span>
          </div>

          <div className="space-y-2">
            {recentlyActiveLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                <div className="truncate pr-2">
                  <Link href={`/leads/${l.id}`} prefetch={true} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block">
                    {l.company.name}
                  </Link>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{l.primaryContact?.fullName || "Primary Contact"}</span>
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {stageLabel(l.stage)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Going Cold */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f121a] p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Snowflake className="h-4 w-4 text-sky-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Going Cold</span>
            </div>
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
              &gt; 14 Days
            </span>
          </div>

          <div className="space-y-2">
            {goingColdLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                <div className="truncate pr-2">
                  <Link href={`/leads/${l.id}`} prefetch={true} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 truncate block">
                    {l.company.name}
                  </Link>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Idle since {formatDate(l.updatedAt)}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50" asChild>
                  <Link href={`/leads/${l.id}`} prefetch={true}>Revive</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f121a] p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-rose-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Needs Attention</span>
            </div>
            <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/50">
              Attention
            </span>
          </div>

          <div className="space-y-2">
            {overdueLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                <div className="truncate pr-2">
                  <Link href={`/leads/${l.id}`} prefetch={true} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 truncate block">
                    {l.company.name}
                  </Link>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{l.primaryContact?.fullName || "Primary Contact"}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50" asChild>
                  <Link href={`/leads/${l.id}`} prefetch={true}>Check</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
