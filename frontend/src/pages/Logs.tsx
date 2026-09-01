import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { HealthLogRow } from '../types';

export const Logs = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'success' | 'failure'>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ['logs', 'explorer', search, status, from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('limit', '50');
      return (await api.get<{ data: HealthLogRow[]; source: string }>(`/logs?${params.toString()}`)).data;
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.post('/export/logs', { from: from || undefined, to: to || undefined });
      toast.success(`Export queued (job ${res.data.data.jobId}). Check back shortly for the download link.`);
    } catch {
      toast.error('Failed to queue export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Log Explorer</h1>
          <p className="text-sm text-slate-500">
            Search and filter every health check.
            {data?.source === 'mongodb-fallback' && (
              <span className="ml-2 text-amber-500">(OpenSearch unreachable — showing MongoDB results)</span>
            )}
          </p>
        </div>
        <button className="btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Queuing…' : 'Export CSV'}
        </button>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          className="input md:col-span-2"
          placeholder="Search endpoint or error message…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="">All statuses</option>
          <option value="success">Success only</option>
          <option value="failure">Failures only</option>
        </select>
        <div className="flex gap-2">
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        {isFetching ? (
          <div className="p-6 text-sm text-slate-400">Searching…</div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No logs match your filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-5 font-medium">Time</th>
                <th className="py-3 px-5 font-medium">Endpoint</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium">Response time</th>
                <th className="py-3 px-5 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((l, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/60">
                  <td className="py-2.5 px-5 text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="py-2.5 px-5 font-medium">{l.endpointName}</td>
                  <td className="py-2.5 px-5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        l.success
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
                      }`}
                    >
                      {l.statusCode || 'timeout'}
                    </span>
                  </td>
                  <td className="py-2.5 px-5">{l.responseTime} ms</td>
                  <td className="py-2.5 px-5 text-slate-500 max-w-xs truncate">{l.errorMessage || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
