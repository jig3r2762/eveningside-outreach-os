"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Recommendation {
  priority: "HIGH" | "MEDIUM" | "LOW";
  action: string;
  reason: string;
  leadId: string;
  contactName: string;
  companyName: string;
}

export function WhatShouldIDo() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      } else {
        console.error("Failed to fetch recommendations");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && recommendations.length === 0) {
      fetchRecommendations();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md">
          <Sparkles className="mr-2 h-4 w-4" />
          What Should I Do Now?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Your Top Priorities Right Now
          </DialogTitle>
          <DialogDescription>
            AI-generated recommendations based on your current pipeline and overdue items.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <p className="text-sm text-muted-foreground">Analyzing pipeline and activities...</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={
                            rec.priority === "HIGH" ? "text-red-600 border-red-200 bg-red-50" :
                            rec.priority === "MEDIUM" ? "text-yellow-600 border-yellow-200 bg-yellow-50" :
                            "text-green-600 border-green-200 bg-green-50"
                          }>
                            {rec.priority} PRIORITY
                          </Badge>
                          <span className="font-semibold text-sm">{rec.companyName}</span>
                          <span className="text-muted-foreground text-sm">— {rec.contactName}</span>
                        </div>
                        <h4 className="font-medium">{rec.action}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild className="shrink-0 mt-1">
                        <Link href={`/leads/${rec.leadId}`}>
                          Action <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No immediate actions needed. You are all caught up!
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
