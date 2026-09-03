import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { LeadsTable } from "@/components/leads-table";
import { GoogleSheetSyncModal } from "@/components/google-sheet-sync-modal";
import { GmailSyncModal } from "@/components/gmail-sync-modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Download, UploadCloud } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await auth();
  const isAdmin = !session?.user || session?.user?.role === "ADMIN" || session?.user?.email === "jigar@eveningsidelabs.com";
  const userId = session?.user?.id;

  // Run DB queries in parallel for instant sub-second response
  const [users, leads] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.lead.findMany({
      where: isAdmin || !userId ? {} : { assignedToId: userId },
      include: {
        company: true,
        primaryContact: true,
        assignedTo: { select: { id: true, name: true, role: true } },
        followUps: {
          where: { status: "PENDING" },
          orderBy: { dueDate: "asc" },
          take: 1,
        },
        activities: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads & Active Outreach</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? "Master relationship database across all regions and representatives."
              : "Your active assigned prospects and follow-up queue."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Google Sheet Sync */}
          <GoogleSheetSyncModal />

          {/* Live Gmail Sync */}
          <GmailSyncModal />

          {/* Import / Export Shortcuts */}
          <Link href="/settings/import" prefetch={true}>
            <Button variant="outline" size="sm" className="gap-1 text-xs border-slate-200 hover:bg-slate-50">
              <UploadCloud className="h-3.5 w-3.5 text-slate-500" /> Import CSV
            </Button>
          </Link>

          <a href="/api/export?type=leads" download>
            <Button variant="outline" size="sm" className="gap-1 text-xs border-slate-200 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export CSV
            </Button>
          </a>

          <Link href="/companies/new" prefetch={true}>
            <Button size="sm" className="gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
              <Plus className="h-3.5 w-3.5" /> Add Lead
            </Button>
          </Link>
        </div>
      </div>

      <LeadsTable
        initialLeads={leads}
        users={users}
        currentUserId={userId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
