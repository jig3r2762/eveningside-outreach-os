"use client";

import { useEffect, useState } from "react";
import { LEAD_STAGES, getStageColor, stageLabel, getScoreColor } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, User, ArrowRight, DollarSign, Globe } from "lucide-react";

type Lead = {
  id: string;
  stage: string;
  leadScore: number;
  pipelineValue: number;
  updatedAt: string;
  company: { id: string; name: string; industry?: string; country?: string; website?: string };
  primaryContact: { id: string; fullName: string; jobTitle?: string; email?: string; linkedinUrl?: string } | null;
  assignedTo: { id: string; name: string } | null;
};

type GroupedLeads = Record<string, Lead[]>;

export function PipelineBoard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GroupedLeads>({});
  const [totalCount, setTotalCount] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  // Filters
  const [ownerId, setOwnerId] = useState<string>("all");
  const [market, setMarket] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("");

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ownerId !== "all") params.append("ownerId", ownerId);
      if (market !== "all") params.append("market", market);
      if (minScore) params.append("minScore", minScore);

      const res = await fetch(`/api/leads/pipeline?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || {});
        setTotalCount(json.totalCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch pipeline", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [ownerId, market, minScore]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d)) setUsers(d);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleMoveStage = async (leadId: string, currentStage: string, newStage: string) => {
    if (currentStage === newStage) return;
    setUpdatingLeadId(leadId);

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (res.ok) {
        // Optimistically move lead in local state
        setData((prev) => {
          const updated = { ...prev };
          let movedLead: Lead | undefined;

          // Remove from old
          if (updated[currentStage]) {
            movedLead = updated[currentStage].find((l) => l.id === leadId);
            updated[currentStage] = updated[currentStage].filter((l) => l.id !== leadId);
          }

          // Add to new
          if (movedLead) {
            movedLead = { ...movedLead, stage: newStage, updatedAt: new Date().toISOString() };
            updated[newStage] = [movedLead, ...(updated[newStage] || [])];
          }

          return updated;
        });
      }
    } catch (e) {
      console.error("Failed to move stage", e);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] space-y-3">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Owner Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Rep:</span>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger className="h-8 text-xs w-44 bg-white">
                <SelectValue placeholder="All Reps (Master View)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌐 Master View (All Reps)</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    👤 {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Market Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Market:</span>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger className="h-8 text-xs w-32 bg-white">
                <SelectValue placeholder="All Markets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Score */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Min Score:</span>
            <Input
              type="number"
              placeholder="e.g. 80"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="h-8 text-xs w-24 bg-white"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Total Leads in Pipeline: <strong>{totalCount}</strong>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-hidden relative border rounded-lg bg-gray-100/60">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-xs">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          </div>
        )}

        <div className="h-full w-full overflow-x-auto p-3">
          <div className="flex gap-3 h-full" style={{ width: "max-content" }}>
            {LEAD_STAGES.map((stage) => {
              const columnLeads = data[stage] || [];
              const stageValue = columnLeads.reduce((acc, lead) => acc + (lead.pipelineValue || 0), 0);
              const isOpportunityStage = ["QUALIFIED_OPPORTUNITY", "PROPOSAL", "NEGOTIATION"].includes(stage);

              return (
                <div
                  key={stage}
                  className="flex flex-col w-[280px] shrink-0 bg-white rounded-lg border border-gray-200/80 shadow-xs h-full overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-2.5 border-b bg-gray-50/90 flex flex-col gap-1 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-gray-800 truncate" title={stageLabel(stage)}>
                        {stageLabel(stage)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 font-bold">
                        {columnLeads.length}
                      </span>
                    </div>
                    {isOpportunityStage && stageValue > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">
                        <DollarSign className="h-3 w-3" />
                        ${stageValue.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Cards Scrollable Area */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
                    {columnLeads.map((lead) => {
                      const daysInStage = Math.floor(
                        (new Date().getTime() - new Date(lead.updatedAt).getTime()) / (1000 * 3600 * 24)
                      );

                      return (
                        <div
                          key={lead.id}
                          className={`p-3 rounded-lg border bg-white hover:shadow-md transition-all space-y-2 ${
                            updatingLeadId === lead.id ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          {/* Company & Score */}
                          <div className="flex items-start justify-between gap-1.5">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="font-semibold text-xs text-gray-900 hover:text-indigo-600 line-clamp-1 flex items-center gap-1"
                            >
                              <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                              {lead.company?.name || "Unknown Company"}
                            </Link>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${getScoreColor(
                                lead.leadScore
                              )}`}
                            >
                              {lead.leadScore}
                            </span>
                          </div>

                          {/* Contact Info */}
                          {lead.primaryContact && (
                            <div className="text-[11px] text-gray-600 flex items-center justify-between">
                              <span className="truncate max-w-[160px] flex items-center gap-1">
                                <User className="h-3 w-3 text-gray-400 shrink-0" />
                                {lead.primaryContact.fullName}
                              </span>
                              {lead.primaryContact.linkedinUrl && (
                                <a
                                  href={lead.primaryContact.linkedinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="h-4 w-4 flex items-center justify-center rounded bg-blue-600 text-white text-[9px] font-bold shrink-0"
                                >
                                  in
                                </a>
                              )}
                            </div>
                          )}

                          {/* Meta Row: Rep & Days in Stage */}
                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t">
                            <span>{daysInStage === 0 ? "Today" : `${daysInStage}d ago`}</span>
                            <span>{lead.assignedTo?.name ? `👤 ${lead.assignedTo.name}` : "Unassigned"}</span>
                          </div>

                          {/* 1-Click Move Stage Dropdown */}
                          <div className="pt-1">
                            <Select
                              value={lead.stage}
                              onValueChange={(newStage) => handleMoveStage(lead.id, lead.stage, newStage)}
                            >
                              <SelectTrigger className="h-6 text-[10px] px-1.5 w-full bg-gray-50 border-dashed">
                                <span className="text-gray-500 mr-1">Move:</span>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LEAD_STAGES.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    {stageLabel(s)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}

                    {columnLeads.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-gray-400 border border-dashed rounded-lg bg-gray-50/50">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
