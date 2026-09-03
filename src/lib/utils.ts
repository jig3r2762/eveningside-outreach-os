import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(d);
}

export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800/40";
  if (score >= 65) return "text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 dark:border dark:border-blue-800/40";
  if (score >= 50) return "text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 dark:border dark:border-amber-800/40";
  return "text-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border dark:border-slate-800";
}

export function getScoreGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    NEW: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border dark:border-slate-800",
    RESEARCHING: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 dark:border dark:border-purple-800/40",
    QUALIFIED: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:border dark:border-blue-800/40",
    READY_TO_CONTACT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border dark:border-cyan-800/40",
    CONTACTED: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:border dark:border-amber-800/40",
    CONNECTED: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 dark:border dark:border-orange-800/40",
    CONVERSATION: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:border dark:border-amber-800/40",
    DISCOVERY_CALL: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border dark:border-indigo-800/40",
    QUALIFIED_OPPORTUNITY: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 dark:border dark:border-violet-800/40",
    PROPOSAL: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 dark:border dark:border-pink-800/40",
    NEGOTIATION: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:border dark:border-rose-800/40",
    WON: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800/40",
    LOST: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:border dark:border-rose-800/40",
    NURTURE: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 dark:border dark:border-teal-800/40",
  };
  return colors[stage] || "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    HIGH: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  };
  return colors[priority] || "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    SKIPPED: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
    OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  };
  return colors[status] || "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
}

export function stageLabel(stage: string): string {
  return stage
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const LEAD_STAGES = [
  "NEW",
  "RESEARCHING",
  "QUALIFIED",
  "READY_TO_CONTACT",
  "CONTACTED",
  "CONNECTED",
  "CONVERSATION",
  "DISCOVERY_CALL",
  "QUALIFIED_OPPORTUNITY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
  "NURTURE",
] as const;

export const CHANNELS = [
  "EMAIL",
  "LINKEDIN",
  "PHONE",
  "WHATSAPP",
  "REFERRAL",
  "WEBSITE",
  "IN_PERSON",
  "OTHER",
] as const;

export const ACTIVITY_TYPES = [
  "CONNECTION_REQUEST",
  "CONNECTION_ACCEPTED",
  "FIRST_MESSAGE",
  "FOLLOW_UP",
  "EMAIL_SENT",
  "EMAIL_REPLY",
  "CALL_ATTEMPT",
  "CALL_CONNECTED",
  "WHATSAPP_MESSAGE",
  "MEETING",
  "PROPOSAL",
  "OTHER",
] as const;

export const DECISION_MAKER_LEVELS = [
  "FOUNDER",
  "OWNER",
  "CEO",
  "MANAGING_DIRECTOR",
  "DIRECTOR",
  "COO",
  "CFO",
  "CTO",
  "VP",
  "HEAD_OF_OPERATIONS",
  "HEAD_OF_MANUFACTURING",
  "PLANT_MANAGER",
  "IT_DIRECTOR",
  "PROCUREMENT_HEAD",
  "OTHER",
] as const;

export const LOST_REASONS = [
  "NO_BUDGET",
  "NO_NEED",
  "BAD_TIMING",
  "COMPETITOR",
  "NO_RESPONSE",
  "WRONG_CONTACT",
  "NOT_A_FIT",
  "OTHER",
] as const;

export const TASK_OUTCOMES = [
  "NO_RESPONSE",
  "REPLIED",
  "INTERESTED",
  "NOT_INTERESTED",
  "MEETING_BOOKED",
  "WRONG_PERSON",
  "OTHER",
] as const;
