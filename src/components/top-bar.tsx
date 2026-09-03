"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, LogOut, User, Sparkles, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { GlobalSearch } from "@/components/global-search";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
  const { data: session } = useSession();

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c0e14]/90 backdrop-blur-md px-6 z-10 transition-colors">
      {/* Search & Command Trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <GlobalSearch />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <Sparkles className="h-3 w-3 text-indigo-500" />
          <span>Evening Side AI</span>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700">
                <AvatarFallback className="text-xs bg-slate-900 dark:bg-indigo-600 font-semibold text-white">
                  {session?.user?.name ? getInitials(session.user.name) : "ES"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
                  {session?.user?.name || "Jigar"}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {session?.user?.role || "ADMIN"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 shadow-lg border-slate-200 dark:border-slate-800 dark:bg-[#0f121a]">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{session?.user?.name || "Jigar"}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{session?.user?.email || "jigar@eveningsidelabs.com"}</span>
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase">
                  {session?.user?.role || "ADMIN"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:bg-slate-800" />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-red-600 dark:text-red-400 cursor-pointer">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
