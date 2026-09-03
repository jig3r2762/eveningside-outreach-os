"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Radio,
  ExternalLink,
  Code2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function GoogleSheetSyncModal() {
  const [open, setOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [saveAsPermanent, setSaveAsPermanent] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showWebhookCode, setShowWebhookCode] = useState(false);
  const router = useRouter();

  // Load saved Google Sheet URL on open
  useEffect(() => {
    if (open) {
      fetch("/api/sync-sheet/live")
        .then((res) => res.json())
        .then((data) => {
          if (data.hasUrl) {
            setLastSyncTime(data.lastSync ? new Date(data.lastSync).toLocaleTimeString() : null);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // POST to live sync endpoint which saves url and runs sync & cadence recompute
      const res = await fetch("/api/sync-sheet/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync with Google Sheet");

      setResult(data.result);
      setLastSyncTime(new Date().toLocaleTimeString());
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs bg-white dark:bg-[#0f121a] text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Sync Google Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl p-6 shadow-2xl border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Automated Google Sheet 2-Way Sync
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Background Sync Active
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Save your Google Sheet link once. Outreach OS continuously auto-syncs your spreadsheet in the background, calculates F1/F2/F3 follow-ups, and prevents duplicate records.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSync} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Sheet Synchronized & Follow-up Cadence Updated!
              </div>
              <div className="grid grid-cols-2 gap-2 text-emerald-700 pt-1 text-[11px]">
                <div>• Created: <strong>{result.leadsCreated} new leads</strong></div>
                <div>• Updated: <strong>{result.leadsUpdated} existing leads</strong></div>
                <div>• Total Rows: <strong>{result.totalRows}</strong></div>
                <div>• Follow-ups: <strong>Auto-scheduled (F1/F2/F3)</strong></div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Google Sheet Share URL</Label>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="text-xs bg-white font-mono"
              required
            />
            <p className="text-[11px] text-gray-500">
              Ensure sheet sharing is set to <strong>"Anyone with the link can view"</strong>.
            </p>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Instant Real-Time Sync on Every Edit
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-blue-600 hover:text-blue-700 p-0"
                onClick={() => setShowWebhookCode(!showWebhookCode)}
              >
                {showWebhookCode ? "Hide Webhook Script" : "View 1-Click Apps Script"}
              </Button>
            </div>

            {showWebhookCode ? (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-gray-600">
                  In your Google Sheet, go to <strong>Extensions</strong> &gt; <strong>Apps Script</strong>, paste this code, and save. The instant you edit any cell, your sheet syncs automatically!
                </p>
                <pre className="p-2.5 bg-gray-900 text-gray-100 rounded-lg text-[10px] font-mono overflow-x-auto">
{`function onEdit(e) {
  UrlFetchApp.fetch("http://localhost:3000/api/sync-sheet/live", {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify({ sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() }),
    muteHttpExceptions: true
  });
}`}
                </pre>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">
                Outreach OS checks for updates every 2.5 minutes automatically in the background while you work.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-8 text-xs">
              Close
            </Button>
            <Button type="submit" size="sm" disabled={loading || !sheetUrl.trim()} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Connecting & Syncing..." : "Connect & Auto-Sync Sheet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
