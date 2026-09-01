import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../api/client';
import { DashboardData, HealthLogRow } from '../types';
import { KpiCard } from '../components/KpiCard';

const COLORS = ['#3366ff', '#22c55e', '#f59e0b', '#ef4444'];

export const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<{ data: DashboardData }>('/dashboard')).data.data,
    refetchInterval: 30_000,
  });

  const { data: logs } = useQuery({
    queryKey: ['logs', 'recent'],
    queryFn: async () => (await api.get<{ data: HealthLogRow[] }>('/logs?limit=8')).data.data,
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500">Live overview of the last 24 hours across all your endpoints.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Uptime" value={`${data.uptimePercent}%`} tone={data.uptimePercent > 99 ? 'good' : 'default'} />
        <KpiCard label="Avg latency" value={`${data.avgLatency} ms`} />
        <KpiCard label="Healthy APIs" value={String(data.healthyApis)} tone="good" />
        <KpiCard label="Failed today" value={String(data.failedToday)} tone={data.failedToday > 0 ? 'bad' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Latency (last 24h)</h2>
          {data.latencyTrend.length === 0 ? (
            <EmptyState text="No checks recorded yet. Add an endpoint to start collecting data." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.latencyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={false} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v} ms`, 'Latency']} />
                <Line type="monotone" dataKey="responseTime" stroke="#3366ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Status distribution</h2>
          {data.statusDistribution.length === 0 ? (
            <EmptyState text="Nothing to show yet." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.statusDistribution} dataKey="count" nameKey="status" innerRadius={45} outerRadius={75}>
                  {data.statusDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Uptime trend</h2>
        {data.uptimeTrend.length === 0 ? (
          <EmptyState text="Uptime history will appear once checks start running." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.uptimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Uptime']} />
              <Line type="monotone" dataKey="uptimePercent" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Recent monitoring logs</h2>
        {!logs || logs.length === 0 ? (
          <EmptyState text="No logs yet — add an endpoint to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 font-medium">Endpoint</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Latency</th>
                  <th className="py-2 font-medium">Checked at</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/60">
                    <td className="py-2.5">{l.endpointName}</td>
                    <td className="py-2.5">
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
                    <td className="py-2.5">{l.responseTime} ms</td>
                    <td className="py-2.5 text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="h-32 flex items-center justify-center text-sm text-slate-400 text-center px-4">{text}</div>
);
