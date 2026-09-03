"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Contact2,
  Send,
  Clock,
  GitBranch,
  CheckSquare,
  Search,
  BarChart3,
  Settings,
  Zap,
  CalendarDays,
  FileText,
  Briefcase,
  ShieldCheck,
  Activity,
  Command,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigationGroups = [
  {
    title: "Prospecting & CRM",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Leads", href: "/leads", icon: Users },
      { name: "Companies", href: "/companies", icon: Building2 },
      { name: "Contacts", href: "/contacts", icon: Contact2 },
    ],
  },
  {
    title: "Outreach & Cadence",
    items: [
      { name: "Outreach History", href: "/outreach", icon: Send },
      { name: "Follow-ups", href: "/follow-ups", icon: Clock },
      { name: "AI Research", href: "/research", icon: Search },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
    ],
  },
  {
    title: "Deals & Revenue",
    items: [
      { name: "Opportunity Pipeline", href: "/pipeline/opportunities", icon: GitBranch },
      { name: "Meetings", href: "/meetings", icon: CalendarDays },
      { name: "Proposals", href: "/proposals", icon: FileText },
      { name: "Won Clients", href: "/clients", icon: Briefcase },
    ],
  },
  {
    title: "Platform & Ops",
    items: [
      { name: "Funnel Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Data Quality", href: "/data-quality", icon: ShieldCheck },
      { name: "System Health", href: "/system-health", icon: Activity },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-[#1e2330] bg-[#0c0e14] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-[#1e2330] px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
            <Zap className="h-3.5 w-3.5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-100 tracking-tight">Outreach OS</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">Evening Side Labs</span>
          </div>
        </div>

        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true });
            document.dispatchEvent(event);
          }}
          className="flex items-center gap-1 rounded bg-[#161a24] px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-[#252b3b] hover:text-slate-200 transition-colors"
          title="Command Palette (Ctrl + K)"
        >
          <Command className="h-2.5 w-2.5" />
          <span>K</span>
        </button>
      </div>

      {/* Navigation Groups */}
      <ScrollArea className="flex-1 py-3 px-2.5">
        <nav className="space-y-4">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      "group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/20 shadow-xs"
                        : "text-slate-400 hover:bg-[#151922] hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-colors",
                          isActive
                            ? "text-indigo-400"
                            : "text-slate-400 group-hover:text-slate-300"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Modern Status Footer */}
      <div className="border-t border-[#1e2330] p-3 bg-[#090b10]">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-300">Database Active</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 text-[10px] font-mono border border-emerald-800/40">
            Postgres
          </span>
        </div>
      </div>
    </div>
  );
}
