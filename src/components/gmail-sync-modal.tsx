"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, RefreshCw, CheckCircle2, AlertCircle, Key, ShieldCheck, ExternalLink, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export function GmailSyncModal() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("app-password");

  // App Password State
  const [gmailAddress, setGmailAddress] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [daysBack, setDaysBack] = useState("90");

  // Manual fallback state
  const [rawText, setRawText] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  // Handle App Password Direct IMAP Sync
  const handleAppPasswordSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailAddress.trim() || !appPassword.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/gmail/imap-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: gmailAddress.trim(),
          appPassword: appPassword.trim(),
          daysBack: parseInt(daysBack),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync with Gmail");

      setResult(data);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sync with Gmail");
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Log Sync
  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to match emails");

      setResult(data);
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
        <Button variant="outline" size="sm" className="gap-1.5 text-xs bg-white dark:bg-[#0f121a] text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40">
          <Mail className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          Sync from Gmail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-600" />
            Automatic Gmail Outreach Sync
          </DialogTitle>
          <DialogDescription className="text-xs">
            Connect your Gmail or Google Workspace to automatically scan Sent emails, match company domains, and update contact dates with zero manual entry.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-3.5 bg-green-50 border border-green-200 rounded-md space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Gmail Scan Completed Successfully!
            </div>
            <div className="grid grid-cols-2 gap-2 text-green-700 pt-1">
              <div>• Sent Emails Scanned: <strong>{result.totalProcessed}</strong></div>
              <div>• Companies Matched: <strong>{result.companiesMatched}</strong></div>
              <div>• Leads Updated to Contacted: <strong>{result.leadsUpdated}</strong></div>
              <div>• Timeline Activities Logged: <strong>{result.activitiesCreated}</strong></div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-1">
          <TabsList className="grid grid-cols-2 text-xs">
            <TabsTrigger value="app-password" className="gap-1.5 text-xs">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Direct Gmail Auto-Sync
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5" /> Sent Log Scanner
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: 1-Step App Password Direct Sync */}
          <TabsContent value="app-password" className="space-y-4 pt-3">
            <form onSubmit={handleAppPasswordSync} className="space-y-3.5">
              <div className="p-3 bg-gray-50 border rounded-md text-xs text-gray-600 space-y-1.5">
                <div className="font-semibold text-gray-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    How to connect in 10 seconds:
                  </span>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    Get App Password <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p>
                  1. Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google App Passwords</a>.<br />
                  2. Type <strong>Outreach OS</strong> and click <strong>Create</strong>.<br />
                  3. Paste the 16-character code below. Outreach OS will automatically scan your Sent Mail!
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Your Google / Gmail Email Address</Label>
                <Input
                  type="email"
                  placeholder="e.g. jigar@eveningsidelabs.com or you@gmail.com"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">16-Character Google App Password</Label>
                <Input
                  type="password"
                  placeholder="abcd efgh ijkl mnop"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Timeframe to Scan</Label>
                <Select value={daysBack} onValueChange={setDaysBack}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Past 30 Days of Sent Mail</SelectItem>
                    <SelectItem value="60">Past 60 Days of Sent Mail</SelectItem>
                    <SelectItem value="90">Past 90 Days (Recommended)</SelectItem>
                    <SelectItem value="180">Past 6 Months</SelectItem>
                    <SelectItem value="365">Past 1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="submit" size="sm" disabled={loading || !gmailAddress.trim() || !appPassword.trim()} className="gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Scanning Sent Mailbox..." : "Auto-Sync Sent Mailbox"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: Quick Log Scanner Fallback */}
          <TabsContent value="manual" className="space-y-4 pt-3">
            <form onSubmit={handleManualSync} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Paste Sent Emails & Dates</Label>
                <Textarea
                  placeholder={`Paste any text containing recipient emails & dates:\ninfo@hifab.in 2026-08-12\nsales@hrsaluglaze.com Aug 15, 2026`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={5}
                  className="text-xs font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="submit" size="sm" disabled={loading || !rawText.trim()} className="gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Matching Companies..." : "Sync & Match"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
