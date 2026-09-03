"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, CheckCircle2, Clock, Sparkles, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function FollowUpSettingsPage() {
  const [f1Days, setF1Days] = useState(3);
  const [f2Days, setF2Days] = useState(7);
  const [f3Days, setF3Days] = useState(14);
  const [maxFollowUps, setMaxFollowUps] = useState(3);
  const [autoSchedule, setAutoSchedule] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings/followups")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.f1Days !== undefined) setF1Days(data.f1Days);
          if (data.f2Days !== undefined) setF2Days(data.f2Days);
          if (data.f3Days !== undefined) setF3Days(data.f3Days);
          if (data.maxFollowUps !== undefined) setMaxFollowUps(data.maxFollowUps);
          if (data.autoSchedule !== undefined) setAutoSchedule(data.autoSchedule);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/settings/followups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          f1Days: Number(f1Days),
          f2Days: Number(f2Days),
          f3Days: Number(f3Days),
          maxFollowUps: Number(maxFollowUps),
          autoSchedule,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save follow-up cadence", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Follow-Up Reminders & Cadence</h1>
          <p className="text-sm text-gray-500">
            Configure the 3 systematic follow-up steps (F1, F2, F3) for all prospect relationships across the team.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Follow-up cadence updated successfully! All new outreach will follow this schedule.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold">3-Step Outreach Cadence</CardTitle>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Max 3 Follow-ups
              </span>
            </div>
            <CardDescription className="text-xs">
              When an initial outreach (Email / LinkedIn) is logged, Outreach OS systematically calculates and schedules these exact follow-up dates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* F1 Step */}
            <div className="p-3.5 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    F1
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Follow-up 1 (Quick Nudge)</h3>
                    <p className="text-[11px] text-gray-500">Days after initial outreach</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={f1Days}
                    onChange={(e) => setF1Days(parseInt(e.target.value) || 1)}
                    className="w-20 h-8 text-xs text-center font-bold bg-white"
                    required
                  />
                  <span className="text-xs font-medium text-gray-600">days</span>
                </div>
              </div>
            </div>

            {/* F2 Step */}
            <div className="p-3.5 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    F2
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Follow-up 2 (Value Add / Case Study)</h3>
                    <p className="text-[11px] text-gray-500">Days after initial outreach</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="2"
                    max="60"
                    value={f2Days}
                    onChange={(e) => setF2Days(parseInt(e.target.value) || 2)}
                    className="w-20 h-8 text-xs text-center font-bold bg-white"
                    required
                  />
                  <span className="text-xs font-medium text-gray-600">days</span>
                </div>
              </div>
            </div>

            {/* F3 Step */}
            <div className="p-3.5 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                    F3
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Follow-up 3 (Breakup / Final Check-in)</h3>
                    <p className="text-[11px] text-gray-500">Days after initial outreach</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="3"
                    max="90"
                    value={f3Days}
                    onChange={(e) => setF3Days(parseInt(e.target.value) || 3)}
                    className="w-20 h-8 text-xs text-center font-bold bg-white"
                    required
                  />
                  <span className="text-xs font-medium text-gray-600">days</span>
                </div>
              </div>
            </div>

            {/* Auto Schedule Switch */}
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
              <div>
                <Label className="text-xs font-semibold text-gray-900">Systematic Auto-Scheduling</Label>
                <p className="text-[11px] text-gray-500">
                  Automatically set F1, F2, F3 dates and create Follow-up reminders when initial outreach is logged.
                </p>
              </div>
              <Switch checked={autoSchedule} onCheckedChange={setAutoSchedule} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/settings">
            <Button type="button" variant="outline" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="sm" disabled={saving || loading} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
            {saving ? "Saving Cadence..." : "Save Follow-Up Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
