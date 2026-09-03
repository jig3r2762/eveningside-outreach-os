'use client';
import { useEffect, useState } from 'react';
import { Activity, Database, Clock, RefreshCw, List, AlertOctagon } from 'lucide-react';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch('/api/system-health')
      .then(res => res.json())
      .then(setHealth);
  }, []);

  if (!health) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <Activity className="w-8 h-8 text-teal-600" />
        <h1 className="text-3xl font-bold text-gray-900">System Health & Observability</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* DB Connection */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-teal-600" />
            <h2 className="text-lg font-semibold">Supabase DB</h2>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status</span>
            <span className={`font-medium ${health.database.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {health.database.status.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-500">Latency</span>
            <span className="font-medium">{health.database.latencyMs} ms</span>
          </div>
        </div>

        {/* Cron Job */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-teal-600" />
            <h2 className="text-lg font-semibold">Cron Jobs</h2>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status</span>
            <span className="font-medium text-green-600">{health.cron.status.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-500">Last Run</span>
            <span className="font-medium">{new Date(health.cron.lastRun).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Sync */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <RefreshCw className="w-6 h-6 text-teal-600" />
            <h2 className="text-lg font-semibold">Sheet Sync</h2>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status</span>
            <span className="font-medium text-green-600">{health.sync.status.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-500">Last Sync</span>
            <span className="font-medium">{new Date(health.sync.lastSync).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Background Queue */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 lg:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <List className="w-6 h-6 text-teal-600" />
            <h2 className="text-lg font-semibold">Background Job Queue</h2>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-2xl font-bold text-gray-700">{health.queue.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="text-2xl font-bold text-blue-700">{health.queue.processing}</div>
              <div className="text-sm text-blue-500">Processing</div>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <div className="text-2xl font-bold text-green-700">{health.queue.completed}</div>
              <div className="text-sm text-green-500">Completed</div>
            </div>
            <div className="bg-red-50 p-4 rounded-md">
              <div className="text-2xl font-bold text-red-700">{health.queue.failed}</div>
              <div className="text-sm text-red-500">Failed</div>
            </div>
          </div>
        </div>

        {/* API Routes */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <AlertOctagon className="w-6 h-6 text-teal-600" />
            <h2 className="text-lg font-semibold">API Health</h2>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Error Rate</span>
            <span className="font-medium text-green-600">{(health.api.errorRate * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-500">Recent Errors</span>
            <span className="font-medium">{health.api.recentErrors}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
