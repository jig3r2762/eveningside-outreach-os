'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DataQualityPage() {
  const [data, setData] = useState<{ healthScore: number, issues: any[] } | null>(null);

  useEffect(() => {
    fetch('/api/data-quality')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <ShieldAlert className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900">Data Quality Center</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-700">Overall Health Score</h2>
          <p className="text-sm text-gray-500">Based on database completeness and freshness</p>
        </div>
        <div className="text-4xl font-bold text-indigo-600">{data.healthScore}%</div>
      </div>

      <div className="grid gap-6">
        {data.issues.map((issue, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center justify-between border border-gray-200">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{issue.description}</h3>
                <p className="text-sm text-gray-500">{issue.count} records affected</p>
              </div>
            </div>
            <button className="flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-md font-medium transition-colors">
              <CheckCircle className="w-4 h-4" />
              <span>Resolve / Clean Up</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
