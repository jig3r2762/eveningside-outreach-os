"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Something went wrong while loading this page
      </h2>
      <p className="max-w-md text-xs text-slate-500 dark:text-slate-400 mb-6">
        {error.message || "A database query or server operation encountered an issue. Try reloading the view."}
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => reset()}
          size="sm"
          className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-md"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2 text-xs border-slate-300 dark:border-slate-800"
        >
          <Link href="/leads">
            <Home className="h-3.5 w-3.5" />
            View Leads
          </Link>
        </Button>
      </div>
    </div>
  );
}
