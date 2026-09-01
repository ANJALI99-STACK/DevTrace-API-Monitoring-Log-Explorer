import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { AlertItem } from '../types';

export const Alerts = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await api.get<{ data: AlertItem[] }>('/alerts')).data.data,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/alerts/${id}/resolve`),
    onSuccess: () => {
      toast.success('Alert resolved');
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const active = data?.filter((a) => !a.isResolved) ?? [];
  const resolved = data?.filter((a) => a.isResolved) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Alerts</h1>
        <p className="text-sm text-slate-500">Triggered after 3 consecutive failed checks on an endpoint.</p>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Active</h2>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : active.length === 0 ? (
          <p className="text-sm text-slate-400">No active alerts. Everything looks healthy.</p>
        ) : (
          <div className="space-y-3">
            {active.map((a) => (
              <div
                key={a._id}
                className="flex items-start justify-between gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10"
              >
                <div>
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                    {typeof a.endpointId === 'object' ? a.endpointId.name : 'Endpoint'}
                  </p>
                  <p className="text-sm text-rose-600/80 dark:text-rose-300/70 mt-0.5">{a.message}</p>
                  <p className="text-xs text-rose-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => resolveMutation.mutate(a._id)}
                  className="text-xs font-medium bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shrink-0"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">Resolved</h2>
          <div className="space-y-2">
            {resolved.map((a) => (
              <div key={a._id} className="flex justify-between text-sm text-slate-400 py-2 border-b border-slate-50 dark:border-slate-800/60">
                <span>{typeof a.endpointId === 'object' ? a.endpointId.name : 'Endpoint'} — {a.message}</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
