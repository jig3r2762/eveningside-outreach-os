import prisma from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock, GitFork, ChevronRight } from "lucide-react";

export default async function SequencesSettingsPage() {
  const sequences = await prisma.sequence.findMany({
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "asc" },
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Outreach Sequences</h1>
          <p className="text-sm text-gray-500">
            Multi-touch cadence sequences that automatically schedule follow-up reminders and next actions.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sequences.map((seq) => (
          <Card key={seq.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-indigo-600" />
                  <CardTitle className="text-base">{seq.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">{seq.channel}</Badge>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {seq._count.enrollments} Leads Enrolled
                </Badge>
              </div>
              <CardDescription className="text-xs">{seq.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Steps Cadence</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                  {seq.steps.map((step) => (
                    <div key={step.id} className="p-2.5 rounded border bg-gray-50 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-gray-700">
                        <span>Step {step.stepNumber}</span>
                        <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border">
                          Day {step.dayOffset}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium">{step.actionType.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-2">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
