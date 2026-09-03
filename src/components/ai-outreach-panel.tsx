"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Copy,
  Check,
  Send,
  RefreshCw,
  ExternalLink,
  Mail,
  CheckCircle2,
  Clock,
  CalendarCheck,
} from "lucide-react";
import { OutreachMessages } from "@/lib/ai/outreach-generator";
import { useRouter } from "next/navigation";

interface AIOutreachPanelProps {
  leadId: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string | null;
  contactLinkedin?: string | null;
  onLoggedActivity?: () => void;
}

export function AIOutreachPanel({
  leadId,
  companyName,
  contactName,
  contactEmail,
  contactLinkedin,
  onLoggedActivity,
}: AIOutreachPanelProps) {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<OutreachMessages | null>(null);
  const [source, setSource] = useState<"ai" | "template" | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [sentSuccessMsg, setSentSuccessMsg] = useState<string | null>(null);

  // Editable email state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setSentSuccessMsg(null);
    try {
      const res = await fetch("/api/ai/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setSource(data.source);
        setEmailSubject(data.messages.email?.subject || "");
        setEmailBody(data.messages.email?.body || "");
      }
    } catch (err) {
      console.error("Failed to generate outreach:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const logOutreachActivity = async (
    channel: string,
    activityType: string,
    message: string,
    key: string,
    subject?: string
  ) => {
    setSendingKey(key);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          channel,
          activityType,
          message,
          subject,
          direction: "OUTBOUND",
          outcome: "Sent",
        }),
      });

      if (res.ok) {
        setSentSuccessMsg(
          `Logged! Contact date stamped • Lead moved to "Contacted" • Next follow-up scheduled in 3 days.`
        );
        router.refresh();
        if (onLoggedActivity) onLoggedActivity();
      }
    } catch (e) {
      console.error("Failed to log sent activity", e);
    } finally {
      setSendingKey(null);
    }
  };

  // 1-Click Open in Gmail and Auto-Log
  const handleOpenGmailAndLog = async () => {
    const to = contactEmail || "";
    const su = emailSubject || "";
    const body = emailBody || "";

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      to
    )}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(body)}`;

    // Open Gmail composer in new tab
    window.open(gmailUrl, "_blank");

    // Automatically log in Outreach OS
    await logOutreachActivity("EMAIL", "EMAIL_SENT", body, "gmail-compose", su);
  };

  // 1-Click Copy and Open LinkedIn
  const handleLinkedInCopyAndOpen = async (text: string, type: string, key: string) => {
    copyToClipboard(text, key);

    if (contactLinkedin) {
      const url = contactLinkedin.startsWith("http")
        ? contactLinkedin
        : `https://linkedin.com/in/${contactLinkedin}`;
      window.open(url, "_blank");
    }

    await logOutreachActivity("LINKEDIN", type, text, key);
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-base font-semibold">AI Outreach Composer</CardTitle>
          </div>
          {source && (
            <Badge variant={source === "ai" ? "default" : "secondary"} className="text-xs">
              {source === "ai" ? "Personalized with AI" : "Verified Template"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Composes tailored LinkedIn and email messages for {contactName || "the lead"} at {companyName}. Click <strong>Send</strong> to dispatch and auto-log contact dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sentSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{sentSuccessMsg}</span>
          </div>
        )}

        {!messages ? (
          <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50/50 space-y-3">
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Synthesizes company manufacturing fit, pain points, and Evening Side Labs solutions into ready-to-send messages.
            </p>
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {loading ? "Composing Outreach..." : "Compose AI Outreach Messages"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="gap-1 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Regenerate AI Copy
              </Button>
            </div>

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid grid-cols-4 w-full text-xs">
                <TabsTrigger value="email">Email Outreach</TabsTrigger>
                <TabsTrigger value="linkedin">LinkedIn Request</TabsTrigger>
                <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                <TabsTrigger value="discovery">Discovery Call</TabsTrigger>
              </TabsList>

              {/* EMAIL TAB */}
              <TabsContent value="email" className="space-y-3.5 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Subject Line</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="text-xs bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <Label className="text-xs font-semibold text-gray-700">Email Message Body</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copyToClipboard(emailBody, "eb")}
                    >
                      {copiedKey === "eb" ? <Check className="h-3 w-3 text-green-600 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy Body
                    </Button>
                  </div>
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={6}
                    className="text-xs bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                  <div className="text-[11px] text-gray-500">
                    {contactEmail ? (
                      <span>Sending to: <strong>{contactEmail}</strong></span>
                    ) : (
                      <span className="text-amber-600">No email attached — will open Gmail composer</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      disabled={sendingKey === "eb"}
                      onClick={() =>
                        logOutreachActivity("EMAIL", "EMAIL_SENT", emailBody, "eb", emailSubject)
                      }
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark Sent in System
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      className="text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                      disabled={sendingKey === "gmail-compose"}
                      onClick={handleOpenGmailAndLog}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Open in Gmail & Auto-Log
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* LINKEDIN TAB */}
              <TabsContent value="linkedin" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Connection Request ({messages.connectionRequest.length} chars / &lt;300 limit)</span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => copyToClipboard(messages.connectionRequest, "cr")}
                      >
                        {copiedKey === "cr" ? <Check className="h-3.5 w-3.5 text-green-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        Copy
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 gap-1"
                        disabled={sendingKey === "cr"}
                        onClick={() =>
                          handleLinkedInCopyAndOpen(messages.connectionRequest, "CONNECTION_REQUEST", "cr")
                        }
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-0.5" />
                        Copy & Open Profile
                      </Button>
                    </div>
                  </div>
                  <Textarea readOnly value={messages.connectionRequest} rows={3} className="text-xs bg-gray-50/70" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>First LinkedIn Message (After Connection Accepted)</span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => copyToClipboard(messages.firstMessage, "fm")}
                      >
                        {copiedKey === "fm" ? <Check className="h-3.5 w-3.5 text-green-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        disabled={sendingKey === "fm"}
                        onClick={() =>
                          logOutreachActivity("LINKEDIN", "FIRST_MESSAGE", messages.firstMessage, "fm")
                        }
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Mark as Sent
                      </Button>
                    </div>
                  </div>
                  <Textarea readOnly value={messages.firstMessage} rows={4} className="text-xs bg-gray-50/70" />
                </div>
              </TabsContent>

              {/* FOLLOW-UPS TAB */}
              <TabsContent value="followups" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Follow-up 1 (Day 3–5)</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => copyToClipboard(messages.followUp1, "fu1")}
                      >
                        {copiedKey === "fu1" ? <Check className="h-3.5 w-3.5 text-green-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={sendingKey === "fu1"}
                        onClick={() => logOutreachActivity("LINKEDIN", "FOLLOW_UP", messages.followUp1, "fu1")}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Log Sent
                      </Button>
                    </div>
                  </div>
                  <Textarea readOnly value={messages.followUp1} rows={3} className="text-xs bg-gray-50/70" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Follow-up 2 (Day 10–14)</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => copyToClipboard(messages.followUp2, "fu2")}
                      >
                        {copiedKey === "fu2" ? <Check className="h-3.5 w-3.5 text-green-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={sendingKey === "fu2"}
                        onClick={() => logOutreachActivity("LINKEDIN", "FOLLOW_UP", messages.followUp2, "fu2")}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Log Sent
                      </Button>
                    </div>
                  </div>
                  <Textarea readOnly value={messages.followUp2} rows={3} className="text-xs bg-gray-50/70" />
                </div>
              </TabsContent>

              {/* DISCOVERY TAB */}
              <TabsContent value="discovery" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Call Opening Hook:</p>
                  <Textarea readOnly value={messages.callOpening} rows={2} className="text-xs bg-gray-50/70" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Key Discovery Questions:</p>
                  <ul className="space-y-2">
                    {messages.discoveryQuestions?.map((q, idx) => (
                      <li
                        key={idx}
                        className="flex items-start justify-between gap-2 p-2 rounded bg-gray-50 border text-xs text-gray-800"
                      >
                        <span>
                          <strong>{idx + 1}.</strong> {q}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0"
                          onClick={() => copyToClipboard(q, `q${idx}`)}
                        >
                          {copiedKey === `q${idx}` ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
