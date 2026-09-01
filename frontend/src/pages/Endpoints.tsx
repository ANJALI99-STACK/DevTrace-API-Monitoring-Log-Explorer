import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { Endpoint, HttpMethod } from '../types';

const emptyForm = {
  name: '',
  url: '',
  method: 'GET' as HttpMethod,
  expectedStatus: 200,
  interval: 60,
};

export const Endpoints = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: endpoints, isLoading } = useQuery({
    queryKey: ['endpoints'],
    queryFn: async () => (await api.get<{ data: Endpoint[] }>('/endpoints')).data.data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['endpoints'] });

  const createMutation = useMutation({
    mutationFn: () => api.post('/endpoints', form),
    onSuccess: () => {
      toast.success('Endpoint added');
      resetForm();
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to add endpoint'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/endpoints/${editingId}`, form),
    onSuccess: () => {
      toast.success('Endpoint updated');
      resetForm();
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update endpoint'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/endpoints/${id}`),
    onSuccess: () => {
      toast.success('Endpoint deleted');
      invalidate();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/endpoints/${id}/toggle`),
    onSuccess: invalidate,
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (ep: Endpoint) => {
    setForm({
      name: ep.name,
      url: ep.url,
      method: ep.method,
      expectedStatus: ep.expectedStatus,
      interval: ep.interval,
    });
    setEditingId(ep._id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Management</h1>
          <p className="text-sm text-slate-500">Add the endpoints you want DevTrace to watch.</p>
        </div>
        <button className="btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? 'Cancel' : '+ Add endpoint'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editingId ? updateMutation.mutate() : createMutation.mutate();
          }}
          className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Payments API"
              required
            />
          </div>
          <div>
            <label className="label">URL</label>
            <input
              className="input"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://api.example.com/health"
              required
            />
          </div>
          <div>
            <label className="label">HTTP method</label>
            <select
              className="input"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as HttpMethod })}
            >
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Expected status</label>
            <input
              type="number"
              className="input"
              value={form.expectedStatus}
              onChange={(e) => setForm({ ...form, expectedStatus: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Monitoring interval (seconds)</label>
            <input
              type="number"
              min={30}
              className="input"
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Save changes' : 'Add endpoint'}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-400">Loading endpoints…</div>
        ) : !endpoints || endpoints.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No endpoints yet. Add your first one to start monitoring.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-5 font-medium">Name</th>
                <th className="py-3 px-5 font-medium">URL</th>
                <th className="py-3 px-5 font-medium">Method</th>
                <th className="py-3 px-5 font-medium">Interval</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr key={ep._id} className="border-b border-slate-50 dark:border-slate-800/60">
                  <td className="py-3 px-5 font-medium">{ep.name}</td>
                  <td className="py-3 px-5 text-slate-500 truncate max-w-xs">{ep.url}</td>
                  <td className="py-3 px-5">{ep.method}</td>
                  <td className="py-3 px-5">{ep.interval}s</td>
                  <td className="py-3 px-5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        ep.isActive
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {ep.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right space-x-3">
                    <button onClick={() => toggleMutation.mutate(ep._id)} className="text-brand-600 text-xs font-medium">
                      {ep.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => startEdit(ep)} className="text-slate-500 text-xs font-medium">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(ep._id)}
                      className="text-rose-500 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
