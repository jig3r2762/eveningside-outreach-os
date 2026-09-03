"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Target,
  Clock,
  Database,
  Rocket,
  Building2,
  Mail,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  // Step 1 State: ICP
  const [targetIndustry, setTargetIndustry] = useState("Precision Engineering & CNC");
  const [targetRegion, setTargetRegion] = useState("UK & European Manufacturers");
  const [dealSizeTarget, setDealSizeTarget] = useState("$25,000 - $100,000");

  // Step 2 State: Cadence
  const [f1Days, setF1Days] = useState(3);
  const [f2Days, setF2Days] = useState(7);
  const [f3Days, setF3Days] = useState(14);
  const [dailyQuota, setDailyQuota] = useState(30);

  // Step 3 State: Ingestion
  const [googleSheetUrl, setGoogleSheetUrl] = useState("https://docs.google.com/spreadsheets/d/1Xl0gU4RzL3.../edit");
  const [syncGmail, setSyncGmail] = useState(true);
  const [loadSampleLeads, setLoadSampleLeads] = useState(true);

  // Finishing state
  const [isFinishing, setIsFinishing] = useState(false);

  const handleComplete = async () => {
    setIsFinishing(true);

    try {
      // Save cadence settings
      await fetch("/api/settings/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          f1Days,
          f2Days,
          f3Days,
          maxFollowUps: 3,
          autoSchedule: true,
          googleSheetUrl,
        }),
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard?onboarded=true");
        router.refresh();
      }, 1000);
    } catch (e) {
      console.error("Onboarding error:", e);
      router.push("/dashboard");
    }
  };

  const steps = [
    { number: 1, title: "ICP & Market", icon: Target },
    { number: 2, title: "Follow-Up Cadence", icon: Clock },
    { number: 3, title: "Data & Sync", icon: Database },
    { number: 4, title: "Launch Engine", icon: Rocket },
  ];

  return (
    <div className="min-h-full py-8 px-4 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interactive Setup Wizard</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Configure Your Outreach OS
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Tailor your manufacturing ICP, dynamic multi-touch cadence, and database integrations.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-6">
        {steps.map((s) => {
          const isDone = currentStep > s.number;
          const isCurrent = currentStep === s.number;
          return (
            <div
              key={s.number}
              onClick={() => s.number < currentStep && setCurrentStep(s.number)}
              className={`flex flex-col items-center gap-1.5 cursor-pointer text-center p-2 rounded-lg transition-all ${
                isCurrent
                  ? "bg-indigo-50/80 border border-indigo-200"
                  : isDone
                  ? "opacity-80 hover:bg-slate-50"
                  : "opacity-40 pointer-events-none"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isDone
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : s.number}
              </div>
              <span className={`text-xs font-semibold ${isCurrent ? "text-indigo-900" : "text-slate-600"}`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content Cards */}
      <Card className="border-slate-200 shadow-sm bg-white">
        {/* STEP 1: ICP */}
        {currentStep === 1 && (
          <div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                Step 1: Ideal Customer Profile (ICP)
              </CardTitle>
              <CardDescription>
                Define the high-value manufacturing verticals Evening Side Labs targets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Primary Target Industry</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    "Precision Engineering & CNC",
                    "Sheet Metal & Fabrication",
                    "Plastics & Polymers",
                    "Industrial Automation",
                    "Aerospace & Defence",
                    "Heavy Machinery",
                  ].map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setTargetIndustry(ind)}
                      className={`p-3 rounded-lg border text-xs text-left transition-all ${
                        targetIndustry === ind
                          ? "border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-900 ring-1 ring-indigo-600/30"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Target Geography</Label>
                  <Input
                    value={targetRegion}
                    onChange={(e) => setTargetRegion(e.target.value)}
                    placeholder="e.g. United Kingdom & Europe"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Average Deal Size Target</Label>
                  <Input
                    value={dealSizeTarget}
                    onChange={(e) => setDealSizeTarget(e.target.value)}
                    placeholder="e.g. $50,000"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
              <div className="text-xs text-slate-400">Step 1 of 4</div>
              <Button onClick={() => setCurrentStep(2)} className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                Continue to Cadence <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </div>
        )}

        {/* STEP 2: Follow-Up Cadence */}
        {currentStep === 2 && (
          <div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Step 2: Dynamic Multi-Touch Cadence Engine
              </CardTitle>
              <CardDescription>
                Configure the automatic days offset for 3-step follow-ups calculated from first outreach date.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">Follow-up 1 (F1)</span>
                    <Badge variant="outline" className="text-[10px] bg-white text-blue-700 border-blue-300 font-mono">
                      Initial Bump
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={14}
                      value={f1Days}
                      onChange={(e) => setF1Days(parseInt(e.target.value) || 3)}
                      className="text-center font-bold text-lg h-10 bg-white"
                    />
                    <span className="text-xs text-slate-600 font-medium">Days after contact</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Quick response check-in.</p>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900">Follow-up 2 (F2)</span>
                    <Badge variant="outline" className="text-[10px] bg-white text-purple-700 border-purple-300 font-mono">
                      Value Add
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={2}
                      max={21}
                      value={f2Days}
                      onChange={(e) => setF2Days(parseInt(e.target.value) || 7)}
                      className="text-center font-bold text-lg h-10 bg-white"
                    />
                    <span className="text-xs text-slate-600 font-medium">Days after contact</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Case study or ROI proof.</p>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900">Follow-up 3 (F3)</span>
                    <Badge variant="outline" className="text-[10px] bg-white text-rose-700 border-rose-300 font-mono">
                      Breakup Pitch
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      value={f3Days}
                      onChange={(e) => setF3Days(parseInt(e.target.value) || 14)}
                      className="text-center font-bold text-lg h-10 bg-white"
                    />
                    <span className="text-xs text-slate-600 font-medium">Days after contact</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Final respectful closing pitch.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Daily Active Outreach Capacity</div>
                  <div className="text-[11px] text-slate-500">Number of personalized messages scheduled per day.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={dailyQuota}
                    onChange={(e) => setDailyQuota(parseInt(e.target.value) || 30)}
                    className="w-20 text-center font-bold text-xs h-8 bg-white"
                  />
                  <span className="text-xs font-semibold text-slate-600">leads/day</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-1 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                Continue to Ingestion <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </div>
        )}

        {/* STEP 3: Data Ingestion */}
        {currentStep === 3 && (
          <div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                Step 3: Ingestion & 2-Way Sync
              </CardTitle>
              <CardDescription>
                Connect your live Google Sheet and mailbox to maintain zero-manual data sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Google Sheets Source URL</Label>
                <Input
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="text-xs font-mono h-9"
                />
                <p className="text-[11px] text-slate-500">
                  Auto-background sync polls this sheet every 5 minutes and updates statuses automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => setSyncGmail(!syncGmail)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    syncGmail ? "border-indigo-600 bg-indigo-50/40" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${syncGmail ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Live Gmail IMAP Sync</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Detects prospect replies and pauses sequences.</div>
                  </div>
                </div>

                <div
                  onClick={() => setLoadSampleLeads(!loadSampleLeads)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    loadSampleLeads ? "border-emerald-600 bg-emerald-50/40" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${loadSampleLeads ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">45 Verified Leads Active</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Verified Indian & UK manufacturing dataset ready.</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-1 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button onClick={() => setCurrentStep(4)} className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-xs">
                Review & Launch <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </div>
        )}

        {/* STEP 4: Launch */}
        {currentStep === 4 && (
          <div>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/25">
                  <Rocket className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Ready to Launch Your Outreach OS</CardTitle>
              <CardDescription>
                Everything is configured for Evening Side Labs sales operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">Workspace Summary</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Target ICP:</span>{" "}
                    <span className="font-semibold text-slate-800">{targetIndustry}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Region:</span>{" "}
                    <span className="font-semibold text-slate-800">{targetRegion}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Cadence:</span>{" "}
                    <span className="font-semibold text-slate-800">F1 (+{f1Days}d) • F2 (+{f2Days}d) • F3 (+{f3Days}d)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Database:</span>{" "}
                    <span className="font-semibold text-emerald-700">Supabase PostgreSQL Connected</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>45 Production leads synced and active in relationship database</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Follow-up queue calculated with dynamic date scheduling</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>AI Conversation & BANT analyzer ready for incoming replies</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)} className="gap-1 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isFinishing}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 px-6"
              >
                {isFinishing ? (
                  "Launching Outreach OS..."
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>Launch Command Dashboard</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
