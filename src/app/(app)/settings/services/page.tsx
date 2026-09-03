import prisma from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";

export default async function ServicesSettingsPage() {
  const services = await prisma.service.findMany({
    include: {
      _count: {
        select: {
          leadServices: true,
          opportunityServices: true,
          clients: true,
        },
      },
    },
    orderBy: { category: "asc" },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Service Capabilities Library</h1>
          <p className="text-sm text-gray-500">
            Evening Side Labs service offerings utilized by the AI outreach engine to generate targeted propositions.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Evening Side Labs Offerings ({services.length})</CardTitle>
          <CardDescription>
            Services available for tagging leads, scoping deals, and matching with operational pain points.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y border rounded-lg overflow-hidden bg-white">
            {services.map((s) => (
              <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/70 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{s.name}</span>
                    <Badge variant="outline" className="text-[10px] py-0">{s.category}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{s.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{s._count.leadServices} Leads</span>
                  <span>{s._count.opportunityServices} Deals</span>
                  <Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50">
                    {s._count.clients} Clients
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
