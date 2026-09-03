"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Radio,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function GoogleSheetAutoSyncCard() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showWebhook, setShowWebhook] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/sync-sheet/live")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasUrl) {
          if (data.lastSync) setLastSync(new Date(data.lastSync).toLocaleTimeString());
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/sync-sheet/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync Google Sheet");

      setResult(data.result);
      setLastSync(new Date().toLocaleTimeString());
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-emerald-200 bg-emerald-50/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                24/7 Automated Google Sheet Live Sync
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Continuous 2-way background synchronization without manual button clicks.
              </CardDescription>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Zero-Manual Sync Active
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Spreadsheet Synchronized & F1/F2/F3 Follow-Ups Recomputed!
            </div>
            <div className="grid grid-cols-2 gap-2 text-emerald-700 pt-1 text-[11px]">
              <div>• Created: <strong>{result.leadsCreated} leads</strong></div>
              <div>• Updated: <strong>{result.leadsUpdated} existing</strong></div>
              <div>• Total Rows: <strong>{result.totalRows}</strong></div>
              <div>• Cadence: <strong>Systematically Scheduled</strong></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveAndSync} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Permanent Google Sheet Share URL
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="text-xs bg-white font-mono"
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !sheetUrl.trim()}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Connecting..." : "Save & Sync Now"}
              </Button>
            </div>
            <p className="text-[11px] text-gray-500">
              Set sheet sharing to <strong>"Anyone with the link can view"</strong>.
            </p>
          </div>
        </form>

        {/* How Auto-Sync Works */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white border border-gray-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              Automatic Background Polling
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Outreach OS polls your sheet every <strong>2.5 minutes</strong> in the browser and every <strong>10 minutes</strong> via Vercel Cron.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Sub-Second Webhook (Optional)
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] text-blue-600 hover:text-blue-700 p-0"
                onClick={() => setShowWebhook(!showWebhook)}
              >
                {showWebhook ? "Hide Script" : "Show Script"}
              </Button>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Paste a 3-line Google Apps Script to trigger instant sync the millisecond any cell is edited.
            </p>
          </div>
        </div>

        {showWebhook && (
          <div className="p-3 rounded-xl bg-gray-900 text-gray-100 text-xs space-y-2">
            <p className="text-[11px] text-gray-300">
              In Google Sheets, go to <strong>Extensions &gt; Apps Script</strong>, paste this snippet, and save:
            </p>
            <pre className="p-2 bg-black/40 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto">
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
        )}
      </CardContent>
    </Card>
  );
}
