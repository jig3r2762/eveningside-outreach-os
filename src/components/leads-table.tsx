"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Mail,
  Phone,
  Building2,
  User,
  Clock,
  Globe,
  Search,
  Edit2,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Filter,
} from "lucide-react";
import { formatDate, getScoreColor, getScoreGrade, getStageColor, stageLabel, LEAD_STAGES } from "@/lib/utils";

const OUTREACH_STATUSES = [
  { value: "NOT_CONTACTED", label: "Not Contacted", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "REQUEST_SENT", label: "Request Sent", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "ACCEPTED", label: "Accepted", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "MESSAGE_SENT", label: "Message Sent", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "REPLIED", label: "Replied", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "MEETING_BOOKED", label: "Meeting Booked", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "NOT_INTERESTED", label: "Not Interested", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const FOLLOWUP_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "SENT", label: "Sent", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "REPLIED", label: "Replied", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "NO_RESPONSE", label: "No Response", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "NOT_NEEDED", label: "Not Needed", color: "bg-slate-50 text-slate-500 border-slate-200" },
];

export function LeadsTable({ initialLeads, users, currentUserId, isAdmin }: any) {
  const [leads, setLeads] = useState(initialLeads);
  const [filterOwner, setFilterOwner] = useState(isAdmin ? "ALL" : currentUserId);
  const [filterStage, setFilterStage] = useState("ALL");
  const [filterOutreach, setFilterOutreach] = useState("ALL");
  const [filterRegion, setFilterRegion] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Quick Follow-Up Cadence & Date Editor State
  const [editingDateLead, setEditingDateLead] = useState<any | null>(null);
  const [editFirstDate, setEditFirstDate] = useState("");
  const [editF1Date, setEditF1Date] = useState("");
  const [editF1Status, setEditF1Status] = useState("PENDING");
  const [editF2Date, setEditF2Date] = useState("");
  const [editF2Status, setEditF2Status] = useState("PENDING");
  const [editF3Date, setEditF3Date] = useState("");
  const [editF3Status, setEditF3Status] = useState("PENDING");

  const openDateEditor = (lead: any) => {
    setEditingDateLead(lead);
    setEditFirstDate(lead.firstContactDate ? new Date(lead.firstContactDate).toISOString().split("T")[0] : "");
    setEditF1Date(lead.f1Date ? new Date(lead.f1Date).toISOString().split("T")[0] : "");
    setEditF1Status(lead.f1Status || "PENDING");
    setEditF2Date(lead.f2Date ? new Date(lead.f2Date).toISOString().split("T")[0] : "");
    setEditF2Status(lead.f2Status || "PENDING");
    setEditF3Date(lead.f3Date ? new Date(lead.f3Date).toISOString().split("T")[0] : "");
    setEditF3Status(lead.f3Status || "PENDING");
  };

  const handleSaveCadence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDateLead) return;

    setUpdatingId(editingDateLead.id);
    try {
      const payload: any = {
        firstContactDate: editFirstDate ? new Date(editFirstDate).toISOString() : null,
        f1Date: editF1Date ? new Date(editF1Date).toISOString() : null,
        f1Status: editF1Status,
        f2Date: editF2Date ? new Date(editF2Date).toISOString() : null,
        f2Status: editF2Status,
        f3Date: editF3Date ? new Date(editF3Date).toISOString() : null,
        f3Status: editF3Status,
      };

      if (editF1Status === "PENDING" && editF1Date) {
        payload.followUpDate = payload.f1Date;
      } else if (editF2Status === "PENDING" && editF2Date) {
        payload.followUpDate = payload.f2Date;
      } else if (editF3Status === "PENDING" && editF3Date) {
        payload.followUpDate = payload.f3Date;
      }

      if (editFirstDate && editingDateLead.stage === "NEW") {
        payload.stage = "CONTACTED";
        payload.outreachStatus = "MESSAGE_SENT";
      }

      const res = await fetch(`/api/leads/${editingDateLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setLeads((prev: any[]) =>
          prev.map((l) => (l.id === editingDateLead.id ? { ...l, ...payload } : l))
        );
        setEditingDateLead(null);
      }
    } catch (e) {
      console.error("Failed to update follow-up cadence", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        setLeads((prev: any[]) =>
          prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
        );
      }
    } catch (e) {
      console.error("Failed to update stage", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOutreachStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      const payload: any = { outreachStatus: newStatus };
      if (["REQUEST_SENT", "MESSAGE_SENT"].includes(newStatus)) {
        payload.stage = "CONTACTED";
        payload.firstContactDate = new Date().toISOString();
      } else if (newStatus === "ACCEPTED") {
        payload.stage = "CONNECTED";
      } else if (newStatus === "REPLIED") {
        payload.stage = "CONVERSATION";
      } else if (newStatus === "MEETING_BOOKED") {
        payload.stage = "DISCOVERY_CALL";
      }

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setLeads((prev: any[]) =>
          prev.map((l) => (l.id === leadId ? { ...l, ...payload } : l))
        );
      }
    } catch (e) {
      console.error("Failed to update outreach status", e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter((lead: any) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCompany = lead.company?.name?.toLowerCase().includes(q);
      const matchContact = lead.primaryContact?.fullName?.toLowerCase().includes(q);
      const matchEmail = lead.primaryContact?.email?.toLowerCase().includes(q);
      const matchIndustry = lead.company?.industry?.toLowerCase().includes(q);
      const matchSegment = (lead.segment || lead.company?.segment)?.toLowerCase().includes(q);
      if (!matchCompany && !matchContact && !matchEmail && !matchIndustry && !matchSegment) {
        return false;
      }
    }

    // Owner
    if (filterOwner !== "ALL" && lead.assignedToId !== filterOwner) {
      return false;
    }

    // Stage
    if (filterStage !== "ALL" && lead.stage !== filterStage) {
      return false;
    }

    // Outreach status
    if (filterOutreach !== "ALL" && (lead.outreachStatus || "NOT_CONTACTED") !== filterOutreach) {
      return false;
    }

    // Region dataset
    if (filterRegion === "INDIA") {
      const country = (lead.market || lead.company?.country || "").toLowerCase();
      if (!country.includes("india")) return false;
    } else if (filterRegion === "UK") {
      const country = (lead.market || lead.company?.country || "").toLowerCase();
      if (!country.includes("uk") && !country.includes("kingdom") && !country.includes("britain")) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Cadence Quick Edit Modal */}
      <Dialog open={!!editingDateLead} onOpenChange={(open) => !open && setEditingDateLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-indigo-600" />
              Follow-Up Cadence &bull; {editingDateLead?.company?.name}
            </DialogTitle>
          </DialogHeader>

          {editingDateLead && (
            <form onSubmit={handleSaveCadence} className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-900">Dynamic 3-Step Cadence:</span>
                <p className="text-slate-500">
                  Initial Outreach &rarr; F1 (+3d) &rarr; F2 (+7d) &rarr; F3 (+14d)
                </p>
              </div>

              <div className="space-y-3">
                {/* Initial Contact */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    First Outreach Date (Initial Contact)
                  </label>
                  <input
                    type="date"
                    value={editFirstDate}
                    onChange={(e) => {
                      const newFirst = e.target.value;
                      setEditFirstDate(newFirst);
                      if (newFirst) {
                        const d = new Date(newFirst);
                        const f1 = new Date(d.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                        const f2 = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                        const f3 = new Date(d.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                        setEditF1Date(f1);
                        setEditF2Date(f2);
                        setEditF3Date(f3);
                      }
                    }}
                    className="w-full h-8 px-2.5 text-xs rounded-md border border-slate-300 bg-white"
                  />
                </div>

                {/* Follow-up 1 (F1) */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-indigo-50/40 border border-indigo-100">
                  <div>
                    <label className="text-[11px] font-bold text-indigo-900 block mb-1">F1 Date (+3d)</label>
                    <input
                      type="date"
                      value={editF1Date}
                      onChange={(e) => setEditF1Date(e.target.value)}
                      className="w-full h-7 px-2 text-[11px] rounded-md border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-indigo-900 block mb-1">F1 Status</label>
                    <Select value={editF1Status} onValueChange={setEditF1Status}>
                      <SelectTrigger className="h-7 text-[11px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOLLOWUP_STATUSES.map((fs) => (
                          <SelectItem key={fs.value} value={fs.value} className="text-xs">
                            {fs.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Follow-up 2 (F2) */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-blue-50/40 border border-blue-100">
                  <div>
                    <label className="text-[11px] font-bold text-blue-900 block mb-1">F2 Date (+7d)</label>
                    <input
                      type="date"
                      value={editF2Date}
                      onChange={(e) => setEditF2Date(e.target.value)}
                      className="w-full h-7 px-2 text-[11px] rounded-md border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-blue-900 block mb-1">F2 Status</label>
                    <Select value={editF2Status} onValueChange={setEditF2Status}>
                      <SelectTrigger className="h-7 text-[11px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOLLOWUP_STATUSES.map((fs) => (
                          <SelectItem key={fs.value} value={fs.value} className="text-xs">
                            {fs.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Follow-up 3 (F3) */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-purple-50/40 border border-purple-100">
                  <div>
                    <label className="text-[11px] font-bold text-purple-900 block mb-1">F3 Date (+14d)</label>
                    <input
                      type="date"
                      value={editF3Date}
                      onChange={(e) => setEditF3Date(e.target.value)}
                      className="w-full h-7 px-2 text-[11px] rounded-md border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-purple-900 block mb-1">F3 Status</label>
                    <Select value={editF3Status} onValueChange={setEditF3Status}>
                      <SelectTrigger className="h-7 text-[11px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FOLLOWUP_STATUSES.map((fs) => (
                          <SelectItem key={fs.value} value={fs.value} className="text-xs">
                            {fs.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingDateLead(null)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updatingId === editingDateLead.id} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Cadence
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies, segments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs w-full rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
            />
          </div>

          {/* Region / Sheet Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Dataset:</span>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="h-8 text-xs w-48 bg-white border-slate-200 rounded-lg font-medium">
                <SelectValue placeholder="All Datasets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">🌐 Master View (All Regions)</SelectItem>
                <SelectItem value="INDIA">🇮🇳 India Manufacturing (Jigar)</SelectItem>
                <SelectItem value="UK">🇬🇧 UK B2B Manufacturers (UK Rep)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role/Owner Selector */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Rep:</span>
              <Select value={filterOwner} onValueChange={setFilterOwner}>
                <SelectTrigger className="h-8 text-xs w-44 bg-white border-slate-200 rounded-lg">
                  <SelectValue placeholder="All Reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Reps</SelectItem>
                  {users?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      👤 {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Stage:</span>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="h-8 text-xs w-36 bg-white border-slate-200 rounded-lg">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stages</SelectItem>
                {LEAD_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {stageLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outreach Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Outreach:</span>
            <Select value={filterOutreach} onValueChange={setFilterOutreach}>
              <SelectTrigger className="h-8 text-xs w-38 bg-white border-slate-200 rounded-lg">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {OUTREACH_STATUSES.map((os) => (
                  <SelectItem key={os.value} value={os.value}>
                    {os.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80">
          Showing <strong>{filteredLeads.length}</strong> of {leads.length} leads
        </div>
      </div>

      {/* High-Precision SaaS CRM Table */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1380px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-3.5 py-2.5 w-[220px]">Company & Website</th>
                <th className="px-3 py-2.5 w-[140px]">Location & Country</th>
                <th className="px-3 py-2.5 w-[150px]">Segment / Industry</th>
                <th className="px-3 py-2.5 w-[160px]">Contact & Title</th>
                <th className="px-2 py-2.5 w-[55px] text-center">LinkedIn</th>
                <th className="px-3 py-2.5 w-[160px]">Email & Phone</th>
                <th className="px-2 py-2.5 w-[65px] text-center">Score</th>
                <th className="px-3 py-2.5 w-[130px]">Lead Stage</th>
                <th className="px-3 py-2.5 w-[130px]">Outreach Status</th>
                <th className="px-3.5 py-2.5 w-[180px]">Follow-Up Cadence</th>
                <th className="px-3 py-2.5 w-[90px]">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No leads found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead: any) => {
                  const company = lead.company;
                  const contact = lead.primaryContact;
                  const currentOutreach =
                    OUTREACH_STATUSES.find((s) => s.value === (lead.outreachStatus || "NOT_CONTACTED")) ||
                    OUTREACH_STATUSES[0];

                  const isUk = (lead.market || company?.country)?.toLowerCase().includes("kingdom") || (lead.market || company?.country)?.toLowerCase().includes("uk");

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* 1. Company Name & Website */}
                      <td className="px-3.5 py-2 align-middle">
                        <Link
                          href={`/leads/${lead.id}`}
                          prefetch={true}
                          className="text-slate-900 font-semibold hover:text-indigo-600 transition-colors line-clamp-1 flex items-center gap-1.5"
                          title={company?.name}
                        >
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{company?.name}</span>
                        </Link>
                        {company?.website ? (
                          <a
                            href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="h-3 w-3 text-blue-400 shrink-0" />
                            <span className="truncate max-w-[170px]">
                              {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* 2. Country & Location */}
                      <td className="px-3 py-2 align-middle">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px]">
                            {isUk ? "🇬🇧" : (lead.market === "India" || company?.country === "India" ? "🇮🇳" : "🇺🇸")}
                          </span>
                          <span className="font-semibold text-slate-800 block text-xs truncate max-w-[110px]" title={lead.market || company?.country || "—"}>
                            {lead.market || company?.country || "—"}
                          </span>
                        </div>
                        {company?.city && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[130px]" title={company.city}>
                            {company.city}
                          </span>
                        )}
                      </td>

                      {/* 3. Segment & Industry */}
                      <td className="px-3 py-2 align-middle space-y-0.5">
                        {(lead.segment || company?.segment) && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-700 font-medium truncate max-w-[140px]" title={lead.segment || company?.segment}>
                            {lead.segment || company?.segment}
                          </span>
                        )}
                        <span className="block text-[11px] text-slate-600 truncate max-w-[140px]" title={company?.industry || "Manufacturing"}>
                          {company?.industry || "Manufacturing"}
                        </span>
                      </td>

                      {/* 4. Decision Maker / Contact */}
                      <td className="px-3 py-2 align-middle">
                        {contact ? (
                          <div className="space-y-0.5">
                            <Link href={`/contacts/${contact.id}`} prefetch={true} className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline block truncate max-w-[155px]">
                              {contact.fullName}
                            </Link>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[155px]" title={contact.jobTitle || "Decision Maker"}>
                              {contact.jobTitle || "Decision Maker"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No contact</span>
                        )}
                      </td>

                      {/* 5. LinkedIn Profile Icon */}
                      <td className="px-2 py-2 align-middle text-center">
                        {(contact?.linkedinUrl || company?.linkedinUrl) ? (
                          <a
                            href={
                              (contact?.linkedinUrl || company?.linkedinUrl).startsWith("http")
                                ? (contact?.linkedinUrl || company?.linkedinUrl)
                                : `https://linkedin.com/in/${contact?.linkedinUrl || company?.linkedinUrl}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            title="Open LinkedIn Profile"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-[#0A66C2] text-white hover:bg-[#084e96] transition-colors shadow-2xs"
                          >
                            <span className="font-bold text-[10px]">in</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* 6. Email & Phone */}
                      <td className="px-3 py-2 align-middle space-y-0.5">
                        {contact?.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1.5 text-[11px] text-slate-700 hover:text-indigo-600 font-medium"
                            title={contact.email}
                          >
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{contact.email}</span>
                          </a>
                        )}
                        {contact?.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-indigo-600"
                            title={contact.phone}
                          >
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{contact.phone}</span>
                          </a>
                        )}
                        {!contact?.email && !contact?.phone && (
                          <span className="text-slate-400 italic text-[11px]">None</span>
                        )}
                      </td>

                      {/* 7. Score Badge */}
                      <td className="px-2 py-2 align-middle text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${getScoreColor(
                            lead.leadScore
                          )}`}
                        >
                          {lead.leadScore} {getScoreGrade(lead.leadScore)}
                        </span>
                      </td>

                      {/* 8. Lead Stage Dropdown */}
                      <td className="px-3 py-2 align-middle">
                        <Select
                          value={lead.stage}
                          onValueChange={(val) => handleStageChange(lead.id, val)}
                          disabled={updatingId === lead.id}
                        >
                          <SelectTrigger className="h-7 text-[11px] px-2 w-[120px] bg-white border-slate-200 font-medium rounded-md shadow-2xs">
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
                      </td>

                      {/* 9. Outreach Status Dropdown */}
                      <td className="px-3 py-2 align-middle">
                        <Select
                          value={lead.outreachStatus || "NOT_CONTACTED"}
                          onValueChange={(val) => handleOutreachStatusChange(lead.id, val)}
                          disabled={updatingId === lead.id}
                        >
                          <SelectTrigger className={`h-7 text-[11px] px-2 w-[120px] font-medium rounded-md border shadow-2xs ${currentOutreach.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OUTREACH_STATUSES.map((os) => (
                              <SelectItem key={os.value} value={os.value} className="text-xs">
                                {os.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* 10. 3-Step Systematic Follow-Up (F1/F2/F3) */}
                      <td
                        className="px-3.5 py-2 align-middle cursor-pointer group/cadence"
                        onClick={() => openDateEditor(lead)}
                        title="Click to configure 3-step Follow-up Cadence"
                      >
                        <div className="space-y-1">
                          {lead.firstContactDate && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span className="font-bold">1st:</span> {formatDate(lead.firstContactDate)}
                            </div>
                          )}

                          <div className="flex items-center gap-1 flex-wrap">
                            {/* F1 Chip */}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                lead.f1Status === "SENT"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : lead.f1Status === "REPLIED"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : lead.f1Date
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-slate-50 text-slate-400 border-slate-200"
                              }`}
                              title={lead.f1Date ? `F1: ${formatDate(lead.f1Date)} (${lead.f1Status || "Pending"})` : "F1: Not set"}
                            >
                              F1{lead.f1Status === "SENT" ? " ✓" : lead.f1Date ? `: ${formatDate(lead.f1Date).split(",")[0]}` : ""}
                            </span>

                            {/* F2 Chip */}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                lead.f2Status === "SENT"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : lead.f2Status === "REPLIED"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : lead.f2Date
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-slate-50 text-slate-400 border-slate-200"
                              }`}
                              title={lead.f2Date ? `F2: ${formatDate(lead.f2Date)} (${lead.f2Status || "Pending"})` : "F2: Not set"}
                            >
                              F2{lead.f2Status === "SENT" ? " ✓" : lead.f2Date ? `: ${formatDate(lead.f2Date).split(",")[0]}` : ""}
                            </span>

                            {/* F3 Chip */}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                lead.f3Status === "SENT"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : lead.f3Status === "REPLIED"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : lead.f3Date
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-slate-50 text-slate-400 border-slate-200"
                              }`}
                              title={lead.f3Date ? `F3: ${formatDate(lead.f3Date)} (${lead.f3Status || "Pending"})` : "F3: Not set"}
                            >
                              F3{lead.f3Status === "SENT" ? " ✓" : lead.f3Date ? `: ${formatDate(lead.f3Date).split(",")[0]}` : ""}
                            </span>

                            <Edit2 className="h-2.5 w-2.5 text-slate-400 opacity-0 group-hover/cadence:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </td>

                      {/* 11. Assigned Rep */}
                      <td className="px-3 py-2 align-middle">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                          <User className="h-3 w-3 text-slate-400" />
                          {lead.assignedTo?.name ? (lead.assignedTo.name.includes("UK") ? "UK Partner" : "Jigar") : "Jigar"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
