import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      company: true,
      onboarding: true,
      salesperson: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients & Onboarding</h1>
          <p className="text-muted-foreground">Manage client transitions and onboarding statuses.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {clients.map((client: any) => (
          <Card key={client.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{client.company.name}</h3>
                <div className="text-sm text-muted-foreground">
                  Converted: {format(new Date(client.convertedAt), 'MMM d, yyyy')} • Value: ${client.dealValue.toLocaleString()}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
                {client.onboarding && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Onboarding: {client.onboarding.status.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {clients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No clients converted yet.
          </div>
        )}
      </div>
    </div>
  );
}
