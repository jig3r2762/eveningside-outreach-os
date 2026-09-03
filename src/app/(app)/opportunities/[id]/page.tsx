import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Target, Activity } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      contact: true,
      owner: true,
      proposals: true,
      meetings: true,
    }
  });

  if (!opportunity) return notFound();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{opportunity.name}</h1>
          <p className="text-muted-foreground">{opportunity.company.name} • {opportunity.stage.replace(/_/g, ' ')}</p>
        </div>
        <Badge variant="outline" className="text-lg py-1 px-3">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opportunity.estimatedValue)} ({opportunity.probability}%)
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solution Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Problem</h4>
                <p className="text-sm text-muted-foreground">{opportunity.problem || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Proposed Solution</h4>
                <p className="text-sm text-muted-foreground">{opportunity.proposedSolution || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Competitors</h4>
                <p className="text-sm text-muted-foreground">{opportunity.competitors || 'None known'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Meetings & Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunity.meetings.length === 0 && opportunity.proposals.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
                {/* List meetings and proposals here */}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Close Date: {opportunity.expectedCloseDate ? format(new Date(opportunity.expectedCloseDate), 'MMM d, yyyy') : 'TBD'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Target className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Owner: {opportunity.owner?.name || 'Unassigned'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
