"use client";

import { useState } from "react";
import { Loader2, Bot, Check, Copy, Calendar, MessageSquare, AlertTriangle, X } from "lucide-react";

interface ReplyAnalysis {
  sentiment: string;
  intent: string;
  painPoints: string;
  budget: string;
  authority: string;
  timeline: string;
  objections: string;
  recommendedResponse: string;
  recommendedAction: string;
}

export function ReplyAnalyzerModal({
  isOpen,
  onClose,
  activityId = "demo-activity-123"
}: {
  isOpen: boolean;
  onClose: () => void;
  activityId?: string;
}) {
  const [replyText, setReplyText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ReplyAnalysis | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!replyText.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const res = await fetch("/api/ai/analyze-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, replyText })
      });
      
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.data);
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (analysis?.recommendedResponse) {
      navigator.clipboard.writeText(analysis.recommendedResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "POSITIVE":
      case "INTERESTED": return "bg-green-100 text-green-700 border-green-200";
      case "NOT_INTERESTED":
      case "DECLINE": return "bg-red-100 text-red-700 border-red-200";
      case "SKEPTICAL":
      case "OBJECTION": return "bg-orange-100 text-orange-700 border-orange-200";
      case "OUT_OF_OFFICE": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-indigo-600">
            <Bot size={20} />
            <h2 className="font-semibold text-lg text-gray-900">AI Reply Intelligence</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Input Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Paste Prospect's Reply
            </label>
            <textarea
              className="w-full h-32 p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
              placeholder="E.g., Hi, we might be interested in a demo next week. We're currently struggling with manual data entry and are looking for a solution before Q4. What's your pricing?"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={!replyText.trim() || isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
              >
                {isAnalyzing ? (
                  <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                ) : (
                  <><Bot size={16} /> Extract Intelligence</>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6 border-t border-gray-100 pt-6">
              
              {/* Top Metrics */}
              <div className="flex flex-wrap gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(analysis.sentiment)}`}>
                  Sentiment: {analysis.sentiment}
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
                  Intent: {analysis.intent}
                </div>
              </div>

              {/* BANT & Signals Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="block text-xs font-semibold text-gray-500 mb-1">Pain Points</span>
                  <span className="text-sm text-gray-800">{analysis.painPoints || "None detected"}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="block text-xs font-semibold text-gray-500 mb-1">Budget Signals</span>
                  <span className="text-sm text-gray-800">{analysis.budget || "None detected"}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="block text-xs font-semibold text-gray-500 mb-1">Authority / Role</span>
                  <span className="text-sm text-gray-800">{analysis.authority || "Unknown"}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="block text-xs font-semibold text-gray-500 mb-1">Timeline</span>
                  <span className="text-sm text-gray-800">{analysis.timeline || "Not mentioned"}</span>
                </div>
              </div>

              {/* Objections */}
              {analysis.objections && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-3 items-start">
                  <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold text-orange-800 mb-1">Objections Detected</span>
                    <span className="text-sm text-orange-900">{analysis.objections}</span>
                  </div>
                </div>
              )}

              {/* AI Recommended Response */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-600" />
                    Recommended Draft
                  </label>
                  <span className="text-xs text-gray-500">Human approval required</span>
                </div>
                
                <div className="relative group">
                  <div className="w-full min-h-[100px] p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                    {analysis.recommendedResponse || "No response drafted. Action recommended instead."}
                  </div>
                  
                  {analysis.recommendedResponse && (
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 bg-white border border-gray-200 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 text-gray-600"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        {analysis && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span className="font-semibold text-gray-900">Next Action:</span>
              {analysis.recommendedAction}
            </div>
            
            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <Calendar size={16} />
                Schedule Meeting
              </button>
              
              <button
                onClick={() => {
                  handleCopy();
                  setTimeout(() => onClose(), 500);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <Check size={16} />
                Approve & Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
