"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import { ImportMapping, ImportResult } from "@/lib/import/csv-importer";
import { GoogleSheetAutoSyncCard } from "@/components/google-sheet-auto-sync-card";

export default function ImportExportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<Partial<ImportMapping>>({});
  const [step, setStep] = useState<"upload" | "map" | "result">("upload");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse file");

      setHeaders(data.headers);
      setRows(data.rows);
      setTotalRows(data.totalRows);
      setMapping(data.autoMapping || {});
      setStep("map");
    } catch (err: any) {
      setError(err.message || "Failed to upload");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      // Re-parse all rows in client or send rows
      const Papa = (await import("papaparse")).default;
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: parsed.data,
          mapping,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setResult(data);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Execution error");
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (field: keyof ImportMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value === "_none" ? undefined : value,
    }));
  };

  const fields: Array<{ key: keyof ImportMapping; label: string; required?: boolean }> = [
    { key: "companyName", label: "Company Name", required: true },
    { key: "website", label: "Website URL (Optional)" },
    { key: "country", label: "Country" },
    { key: "location", label: "Location (City / Region)" },
    { key: "industry", label: "Industry" },
    { key: "decisionMaker", label: "Their Decision Maker (Contact Name)" },
    { key: "jobTitle", label: "Job Title" },
    { key: "linkedinUrl", label: "LinkedIn URL" },
    { key: "email", label: "Their Email" },
    { key: "phone", label: "Business Phone Number" },
    { key: "score", label: "The Score" },
    { key: "leadStatus", label: "Lead Status / Stage" },
    { key: "firstContactDate", label: "First Contact Date" },
    { key: "lastContactDate", label: "Last Contact Date" },
    { key: "followUpDate", label: "Follow-up Research Date / Next Due" },
    { key: "notes", label: "Any Notes / Pain Points" },
    { key: "channel", label: "Outreach Channel (LinkedIn, Email, WhatsApp...)" },
    { key: "outreachStatus", label: "Outreach Status (Request, Sent, Replied...)" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Import & Export Data</h1>
          <p className="text-sm text-gray-500">
            Import existing lead spreadsheets without creating duplicates, or export database records to CSV.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export?type=leads" download>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> Export Leads CSV
            </Button>
          </a>
          <a href="/api/export?type=companies" download>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> Export Companies
            </Button>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* 24/7 Automated Google Sheet Live Sync */}
      <GoogleSheetAutoSyncCard />

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Lead Spreadsheet (CSV)</CardTitle>
            <CardDescription>
              Upload your outreach or prospect list. Duplicate companies (by domain, name, or LinkedIn) and contacts (by email or LinkedIn) will be automatically detected and merged.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Click or drag CSV file here to import</p>
              <p className="text-xs text-gray-400 mt-1">Supports standard CSV exports from Apollo, LinkedIn, Sheets</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Field Mapping */}
      {step === "map" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Map CSV Columns to Outreach OS Fields</CardTitle>
                <CardDescription>
                  Found {headers.length} columns and {totalRows} rows in {file?.name}. Confirm column mappings.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep("upload")} className="text-xs">
                Upload different file
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5 p-2 rounded border bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-gray-700">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </Label>
                    {mapping[f.key] && (
                      <Badge variant="outline" className="text-[10px] text-green-700 bg-green-50 border-green-200">
                        Mapped
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={mapping[f.key] || "_none"}
                    onValueChange={(val) => updateMapping(f.key, val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Select CSV column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Not mapped —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Cancel
              </Button>
              <Button onClick={handleExecuteImport} disabled={loading || !mapping.companyName}>
                {loading ? "Importing Data..." : `Execute Import (${totalRows} Rows)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-base">Import Completed Successfully</CardTitle>
                <CardDescription>Summary of created and merged records</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-xs text-green-700 font-medium">New Companies</p>
                <p className="text-2xl font-bold text-green-900">{result.companiesCreated}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-xs text-blue-700 font-medium">New Contacts</p>
                <p className="text-2xl font-bold text-blue-900">{result.contactsCreated}</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <p className="text-xs text-purple-700 font-medium">New Leads</p>
                <p className="text-2xl font-bold text-purple-900">{result.leadsCreated}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <p className="text-xs text-amber-700 font-medium">Updated / Merged</p>
                <p className="text-2xl font-bold text-amber-900">{result.companiesUpdated + result.contactsUpdated + (result.leadsUpdated || 0)}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-1">
                <p className="text-xs font-semibold text-red-800">Errors ({result.errors.length}):</p>
                <ul className="text-xs text-red-700 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                  {result.errors.map((e, idx) => (
                    <li key={idx}>Row {e.row}: {e.error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Import Another File
              </Button>
              <Link href="/leads">
                <Button className="gap-1">
                  View Leads <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
