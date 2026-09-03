import { Info, Target, AlertCircle, TrendingUp, Users, CheckCircle, Clock } from "lucide-react";

interface AIScoreExplainerProps {
  scoreData?: {
    companyFit: number;
    potentialPain: number;
    buyingSignal: number;
    decisionMakerAccess: number;
    contactQuality: number;
    timingVelocity: number;
    totalScore: number;
    explanation: string;
  };
}

export function AiScoreExplainer({ scoreData }: AIScoreExplainerProps) {
  // Default mock data if none provided
  const data = scoreData || {
    companyFit: 18,
    potentialPain: 16,
    buyingSignal: 12,
    decisionMakerAccess: 10,
    contactQuality: 8,
    timingVelocity: 15,
    totalScore: 79,
    explanation: "This lead is highly prioritized today because they match your ideal customer profile (Enterprise Manufacturing) and recent signals show active pain points around supply chain automation. Their VP of Operations recently engaged with your content, indicating a narrowing buying window."
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = score / max;
    if (percentage >= 0.8) return "text-green-600 bg-green-50";
    if (percentage >= 0.5) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-lg w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp size={20} />
            AI Priority Score
          </h3>
          <p className="text-indigo-100 text-sm mt-1">Real-time qualification breakdown</p>
        </div>
        <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/30 text-center min-w-[70px]">
          <span className="block text-2xl font-bold leading-none">{data.totalScore}</span>
          <span className="block text-[10px] uppercase tracking-wider font-medium opacity-80 mt-1">/ 100</span>
        </div>
      </div>

      {/* Explainer text */}
      <div className="p-4 border-b border-gray-100 bg-indigo-50/30">
        <div className="flex gap-3 items-start">
          <Info size={20} className="text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-sm text-gray-900 block mb-1">Why is this lead prioritized today?</span>
            <p className="text-sm text-gray-600 leading-relaxed">
              {data.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Score Breakdown</h4>
        
        <div className="space-y-3">
          {/* ICP Fit */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <Target size={14} />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-800">ICP Fit</span>
                <span className="block text-[11px] text-gray-500">Firmographics & Tech Stack</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(data.companyFit, 20)}`}>
              {data.companyFit}/20
            </div>
          </div>

          {/* Pain Severity */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <AlertCircle size={14} />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-800">Pain Severity</span>
                <span className="block text-[11px] text-gray-500">Extracted from research</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(data.potentialPain, 20)}`}>
              {data.potentialPain}/20
            </div>
          </div>

          {/* Timing/Velocity */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <Clock size={14} />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-800">Timing & Velocity</span>
                <span className="block text-[11px] text-gray-500">Recent events & engagement</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(data.timingVelocity, 20)}`}>
              {data.timingVelocity}/20
            </div>
          </div>

          {/* Buying Signal */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <TrendingUp size={14} />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-800">Buying Signal</span>
                <span className="block text-[11px] text-gray-500">Intent data & interactions</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(data.buyingSignal, 15)}`}>
              {data.buyingSignal}/15
            </div>
          </div>

          {/* Decision Maker Access */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <Users size={14} />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-800">Decision Maker Access</span>
                <span className="block text-[11px] text-gray-500">Contact level & reachability</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(data.decisionMakerAccess, 15)}`}>
              {data.decisionMakerAccess}/15
            </div>
          </div>

          {/* Contact Quality */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                <CheckCircle size={14} />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-800">Contact Quality</span>
                <span className="block text-[11px] text-gray-500">Verified emails & phones</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(data.contactQuality, 10)}`}>
              {data.contactQuality}/10
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
