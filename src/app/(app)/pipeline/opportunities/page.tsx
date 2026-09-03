import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STAGES = [
  "DISCOVERY_CALL",
  "TECHNICAL_QUALIFIED",
  "SOLUTION_REVIEW",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "VERBAL_COMMIT",
  "WON",
  "LOST"
];

export default async function OpportunitiesPipelinePage() {
  const opportunities = await prisma.opportunity.findMany({
    include: {
      company: true,
      owner: true,
    },
    orderBy: { expectedCloseDate: 'asc' }
  });

  const getStageTotal = (stage: string) => {
    return opportunities
      .filter((o: any) => o.stage === stage)
      .reduce((sum: number, o: any) => sum + (o.estimatedValue * o.probability) / 100, 0);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities Pipeline</h1>
          <p className="text-muted-foreground">Manage active deals across stages.</p>
        </div>
        <Link href="/opportunities/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium">
          New Opportunity
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto flex space-x-4 pb-4">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter((o: any) => o.stage === stage);
          const stageValue = getStageTotal(stage);
          
          return (
            <div key={stage} className="flex-shrink-0 w-80 bg-muted/50 rounded-lg p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm">{stage.replace(/_/g, ' ')}</h3>
                <Badge variant="secondary">{stageOpps.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                Weighted Pipeline: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stageValue)}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {stageOpps.map((opp: any) => (
                  <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                    <Card className="hover:border-primary/50 cursor-pointer transition-colors">
                      <CardContent className="p-4">
                        <div className="font-semibold text-sm mb-1 line-clamp-1">{opp.name}</div>
                        <div className="text-xs text-muted-foreground mb-3">{opp.company.name}</div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center text-muted-foreground">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(opp.estimatedValue)}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {opp.expectedCloseDate ? format(new Date(opp.expectedCloseDate), 'MMM d, yyyy') : 'No Date'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
