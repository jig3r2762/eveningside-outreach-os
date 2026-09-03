'use client';
import { useEffect, useState } from 'react';
import { Settings, Play, Pause, Activity } from 'lucide-react';

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/automations')
      .then(res => res.json())
      .then(data => {
        setAutomations(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Settings className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
      </div>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6">
          {automations.map(rule => (
            <div key={rule.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {rule.enabled ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                  <p className="text-sm text-gray-500">{rule.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600">
                  <Activity className="w-4 h-4" />
                  <span>View Logs</span>
                </button>
              </div>
            </div>
          ))}
          {automations.length === 0 && (
            <div className="text-gray-500 text-center py-8">No automation rules found.</div>
          )}
        </div>
      )}
    </div>
  );
}
