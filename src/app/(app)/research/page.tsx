import prisma from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, ExternalLink, ShieldCheck, AlertCircle, Building2, CheckCircle2 } from "lucide-react";
import { formatDate, getScoreColor, getScoreGrade } from "@/lib/utils";
import { ResearchDossierCard } from "@/components/research-dossier-card";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  // 1. Leads needing research (NEW or RESEARCHING stage with no research or older than 30 days)
  const unresearchedLeads = await prisma.lead.findMany({
    where: {
      stage: { in: ["NEW", "RESEARCHING"] },
      research: { none: {} },
    },
    include: {
      company: true,
      primaryContact: true,
      assignedTo: { select: { name: true } },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  // 2. Recent research reports
  const recentResearch = await prisma.research.findMany({
    include: {
      company: true,
      lead: true,
      claims: true,
      researcher: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 15,
  });

  // 3. Stats
  const totalResearched = await prisma.research.count();
  const verifiedClaimsCount = await prisma.researchClaim.count({
    where: { category: "VERIFIED_FACT" },
  });
  const pendingResearchCount = await prisma.lead.count({
    where: { stage: { in: ["NEW", "RESEARCHING"] }, research: { none: {} } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Research & Intelligence</h1>
          <p className="text-sm text-gray-500">
            Operational characteristics, ERP signals, pain hypotheses, and verifiable evidence.
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Completed Research Profiles</p>
            <p className="text-2xl font-bold text-gray-900">{totalResearched}</p>
          </div>
          <Building2 className="h-8 w-8 text-blue-600 opacity-80" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Verified Evidence Claims</p>
            <p className="text-2xl font-bold text-gray-900">{verifiedClaimsCount}</p>
          </div>
          <ShieldCheck className="h-8 w-8 text-green-600 opacity-80" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Pending Research Queue</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingResearchCount}</p>
          </div>
          <AlertCircle className="h-8 w-8 text-yellow-600 opacity-80" />
        </Card>
      </div>

      {/* Unresearched Queue */}
      {unresearchedLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Research Queue (High Priority)</CardTitle>
            <CardDescription>
              Leads newly identified that need operational and software intelligence prior to outreach.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y border rounded-lg">
              {unresearchedLeads.map((lead) => (
                <div key={lead.id} className="p-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/companies/${lead.companyId}`} className="font-medium text-sm text-gray-900 hover:underline">
                        {lead.company.name}
                      </Link>
                      {lead.company.country && (
                        <Badge variant="outline" className="text-[10px] py-0">{lead.company.country}</Badge>
                      )}
                      {lead.company.industry && (
                        <Badge variant="secondary" className="text-[10px] py-0">{lead.company.industry}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Primary Contact: {lead.primaryContact ? `${lead.primaryContact.fullName} (${lead.primaryContact.jobTitle || "N/A"})` : "None"} • Assigned to {lead.assignedTo?.name || "Unassigned"}
                    </p>
                  </div>
                  <Link href={`/companies/${lead.companyId}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Search className="h-3.5 w-3.5" /> Start Research
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Intelligence Dossiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Completed Intelligence Dossiers</CardTitle>
          <CardDescription>
            Evidence dossiers categorized by fact confidence and verified signals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentResearch.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No research records yet.</p>
            ) : (
              recentResearch.map((r) => (
                <div key={r.id} className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/companies/${r.companyId}`} className="font-semibold text-lg text-gray-900 hover:underline">
                        {r.company.name}
                      </Link>
                      {r.lead && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getScoreColor(r.lead.leadScore)}`}>
                          Score {r.lead.leadScore} ({getScoreGrade(r.lead.leadScore)})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      Researched {formatDate(r.researchDate)} by {r.researcher?.name || "System AI"}
                    </span>
                  </div>
                  <ResearchDossierCard research={r} />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
