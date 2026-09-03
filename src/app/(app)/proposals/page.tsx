import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const proposals = await prisma.proposal.findMany({
    include: {
      company: true,
      opportunity: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposals & Quotations</h1>
          <p className="text-muted-foreground">Track sent proposals and their statuses.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {proposals.map((proposal: any) => (
          <Card key={proposal.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{proposal.title}</h3>
                  <div className="text-sm text-muted-foreground">{proposal.company.name} • {proposal.opportunity.name}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right hidden sm:block">
                  <div className="font-medium flex items-center justify-end">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {new Intl.NumberFormat('en-US', { style: 'decimal' }).format(proposal.value)}
                  </div>
                  <div className="text-xs text-muted-foreground">Version {proposal.version}</div>
                </div>
                <Badge variant={
                  proposal.status === 'ACCEPTED' ? 'default' : 
                  proposal.status === 'REJECTED' ? 'destructive' : 'secondary'
                }>
                  {proposal.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {proposals.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No proposals generated yet.
          </div>
        )}
      </div>
    </div>
  );
}
