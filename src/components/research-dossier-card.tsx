import { AlertCircle, Building2, Cpu, FileText, Lightbulb, Link as LinkIcon, Server, Settings, ShieldCheck } from "lucide-react";

interface ResearchDossierProps {
  research: {
    companyOverview?: string | null;
    manufacturingProcess?: string | null;
    workflowBottlenecks?: string | null;
    erpSignals?: string | null;
    automationSignals?: string | null;
    technologyStack?: string | null;
    pitchAngle?: string | null;
    recommendedService?: string | null;
    confidence?: string | null;
    claims?: { claim: string; source?: string | null; category?: string | null }[];
  };
}

export function ResearchDossierCard({ research }: ResearchDossierProps) {
  if (!research) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <ShieldCheck size={20} className="text-emerald-400" />
          <h2 className="font-semibold">AI Intelligence Dossier</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Confidence:</span>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {research.confidence || "HIGH"}
          </span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          {research.companyOverview && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <Building2 size={16} className="text-indigo-500" /> Company Overview
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {research.companyOverview}
              </p>
            </div>
          )}

          {research.manufacturingProcess && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <Settings size={16} className="text-orange-500" /> Operations & Manufacturing
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {research.manufacturingProcess}
              </p>
            </div>
          )}

          {research.workflowBottlenecks && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <AlertCircle size={16} className="text-red-500" /> Workflow Bottlenecks
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-red-50/50 p-3 rounded-lg border border-red-100">
                {research.workflowBottlenecks}
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {research.erpSignals && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <Server size={16} className="text-blue-500" /> Tech Stack & ERP
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                <p className="text-sm text-gray-700">{research.erpSignals}</p>
                {research.technologyStack && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs font-semibold text-gray-500 block mb-1">Identified Stack:</span>
                    <span className="text-sm text-gray-800">{research.technologyStack}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {research.automationSignals && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <Cpu size={16} className="text-purple-500" /> Automation & Digital Signals
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                {research.automationSignals}
              </p>
            </div>
          )}
          
          {/* Pitch Strategy */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-900 mb-3">
              <Lightbulb size={18} className="text-indigo-600" /> Recommended Strategy
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-indigo-800/70 block mb-1 uppercase tracking-wider">Target Service</span>
                <span className="inline-block px-2.5 py-1 bg-white rounded border border-indigo-200 text-sm font-medium text-indigo-700 shadow-sm">
                  {research.recommendedService || "Digital Transformation"}
                </span>
              </div>
              
              <div>
                <span className="text-xs font-semibold text-indigo-800/70 block mb-1 uppercase tracking-wider">Opening Pitch Angle</span>
                <p className="text-sm text-indigo-900 italic font-medium leading-relaxed bg-white/50 p-3 rounded-lg border border-indigo-200/50">
                  "{research.pitchAngle}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Claims Footer */}
      {research.claims && research.claims.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText size={14} /> Key Evidence Claims
          </h4>
          <div className="flex flex-wrap gap-3">
            {research.claims.map((claim, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <LinkIcon size={12} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-700">{claim.claim}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 rounded">Source: {claim.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


