"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface ResearchClaimItem {
  claim: string;
  source: string;
  sourceUrl?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  category: "VERIFIED_FACT" | "EVIDENCE_BASED_INFERENCE" | "HYPOTHESIS" | "UNKNOWN";
}

interface ResearchFormProps {
  companyId: string;
  leadId?: string;
  initialData?: any;
  onSaved?: () => void;
}

export function ResearchForm({ companyId, leadId, initialData, onSaved }: ResearchFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [companyOverview, setCompanyOverview] = useState(initialData?.companyOverview || "");
  const [products, setProducts] = useState(initialData?.products || "");
  const [manufacturingProcess, setManufacturingProcess] = useState(initialData?.manufacturingProcess || "");
  const [locations, setLocations] = useState(initialData?.locations || "");
  const [operationalComplexity, setOperationalComplexity] = useState(initialData?.operationalComplexity || "");
  const [erpSignals, setErpSignals] = useState(initialData?.erpSignals || "");
  const [automationSignals, setAutomationSignals] = useState(initialData?.automationSignals || "");
  const [hiringSignals, setHiringSignals] = useState(initialData?.hiringSignals || "");
  const [workflowBottlenecks, setWorkflowBottlenecks] = useState(initialData?.workflowBottlenecks || "");
  const [buyingSignals, setBuyingSignals] = useState(initialData?.buyingSignals || "");
  const [technologyStack, setTechnologyStack] = useState(initialData?.technologyStack || "");
  const [confidence, setConfidence] = useState(initialData?.confidence || "MEDIUM");

  const [claims, setClaims] = useState<ResearchClaimItem[]>(
    initialData?.claims || [
      {
        claim: "",
        source: "Company Website",
        sourceUrl: "",
        confidence: "HIGH",
        category: "VERIFIED_FACT",
      },
    ]
  );

  const addClaim = () => {
    setClaims([
      ...claims,
      {
        claim: "",
        source: "Company Website",
        sourceUrl: "",
        confidence: "MEDIUM",
        category: "EVIDENCE_BASED_INFERENCE",
      },
    ]);
  };

  const updateClaim = (index: number, field: keyof ResearchClaimItem, value: any) => {
    const updated = [...claims];
    updated[index] = { ...updated[index], [field]: value };
    setClaims(updated);
  };

  const removeClaim = (index: number) => {
    setClaims(claims.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        companyId,
        leadId,
        companyOverview,
        products,
        manufacturingProcess,
        locations,
        operationalComplexity,
        erpSignals,
        automationSignals,
        hiringSignals,
        workflowBottlenecks,
        buyingSignals,
        technologyStack,
        confidence,
        claims: claims.filter((c) => c.claim.trim() !== ""),
      };

      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save research record");
      setSuccess(true);
      if (onSaved) onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Research saved and qualification re-scored!
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Operational & Signal Intelligence</CardTitle>
          <CardDescription>
            Document confirmed observations and signals about manufacturing, ERP, automation, and workflow friction.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Company Overview & Core Business</Label>
            <Textarea
              value={companyOverview}
              onChange={(e) => setCompanyOverview(e.target.value)}
              rows={2}
              placeholder="What does this company do, who are their customers..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Products / Manufacturing Process</Label>
            <Textarea
              value={products}
              onChange={(e) => setProducts(e.target.value)}
              rows={2}
              placeholder="Products manufactured, machinery types, assembly steps..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Operational Complexity & Multi-location</Label>
            <Textarea
              value={operationalComplexity}
              onChange={(e) => setOperationalComplexity(e.target.value)}
              rows={2}
              placeholder="Supply chain nodes, plant counts, warehouse handoffs..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">ERP & Software Signals</Label>
            <Textarea
              value={erpSignals}
              onChange={(e) => setErpSignals(e.target.value)}
              rows={2}
              placeholder="SAP, Tally, custom legacy software, Excel reliance signals..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Automation / AI / Tech Stack Signals</Label>
            <Textarea
              value={automationSignals}
              onChange={(e) => setAutomationSignals(e.target.value)}
              rows={2}
              placeholder="Prior modernization attempts, job postings for tech, APIs..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Potential Workflow Bottlenecks</Label>
            <Textarea
              value={workflowBottlenecks}
              onChange={(e) => setWorkflowBottlenecks(e.target.value)}
              rows={2}
              placeholder="Manual order entries, production tracking delays, invoice matching..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Buying & Expansion Signals</Label>
            <Textarea
              value={buyingSignals}
              onChange={(e) => setBuyingSignals(e.target.value)}
              rows={2}
              placeholder="New plant openings, leadership changes, funding, scale pain..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Research Claims Table with Verified/Inference taxonomy */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Evidence Claims & Source Verification</CardTitle>
            <CardDescription className="text-xs">
              Every specific claim must be categorized as Verified Fact, Inference, or Hypothesis.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addClaim} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Claim
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {claims.map((c, i) => (
            <div key={i} className="p-3 border rounded-lg bg-gray-50/50 space-y-2">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Specific claim (e.g., Operates 3 plants in Gujarat with manual dispatch planning)"
                    value={c.claim}
                    onChange={(e) => updateClaim(i, "claim", e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-600"
                  onClick={() => removeClaim(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <Input
                  placeholder="Source (e.g. Website, LinkedIn)"
                  value={c.source}
                  onChange={(e) => updateClaim(i, "source", e.target.value)}
                  className="text-xs bg-white"
                />
                <Input
                  placeholder="Source URL"
                  value={c.sourceUrl || ""}
                  onChange={(e) => updateClaim(i, "sourceUrl", e.target.value)}
                  className="text-xs bg-white"
                />
                <Select
                  value={c.category}
                  onValueChange={(val) => updateClaim(i, "category", val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERIFIED_FACT">Verified Fact</SelectItem>
                    <SelectItem value="EVIDENCE_BASED_INFERENCE">Evidence-based Inference</SelectItem>
                    <SelectItem value="HYPOTHESIS">Hypothesis</SelectItem>
                    <SelectItem value="UNKNOWN">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={c.confidence}
                  onValueChange={(val) => updateClaim(i, "confidence", val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High Confidence</SelectItem>
                    <SelectItem value="MEDIUM">Medium Confidence</SelectItem>
                    <SelectItem value="LOW">Low Confidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving Research..." : "Save Research & Auto-Score"}
        </Button>
      </div>
    </form>
  );
}
