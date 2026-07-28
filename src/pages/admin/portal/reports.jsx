import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import AdminLayout from '../../../components/shared/adminLayout';
import { EmptyState, ErrorState, LoadingState } from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';

const STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed'];
const TYPES = ['', 'post', 'meal', 'workout', 'workout_plan'];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ status: 'pending', type: '' });
  const [state, setState] = useState({ loading: true, error: '', updating: '' });

  const loadReports = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admin/reports', {
        params: {
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.type ? { type: filters.type } : {}),
          limit: 100,
        },
      });
      setReports(data?.reports || []);
      setState({ loading: false, error: '', updating: '' });
    } catch (error) {
      setState({
        loading: false,
        updating: '',
        error: error?.response?.data?.message || error?.message || 'Could not load reports.',
      });
    }
  }, [filters.status, filters.type]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateStatus = async (reportId, status) => {
    setState(current => ({ ...current, updating: reportId, error: '' }));
    try {
      const { data } = await axiosInstance.patch(`/admin/reports/${reportId}`, { status });
      if (filters.status && status !== filters.status) {
        setReports(current => current.filter(report => report._id !== reportId));
      } else {
        setReports(current => current.map(report => (
          report._id === reportId ? data.report : report
        )));
      }
      setState(current => ({ ...current, updating: '' }));
    } catch (error) {
      setState(current => ({
        ...current,
        updating: '',
        error: error?.response?.data?.message || error?.message || 'Could not update the report.',
      }));
    }
  };

  return (
    <AdminLayout title="Moderation" subTitle="Review community content reports">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              value={filters.status}
              onChange={event => setFilters(current => ({ ...current, status: event.target.value }))}
              className="ml-2 rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">All</option>
              {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Content
            <select
              value={filters.type}
              onChange={event => setFilters(current => ({ ...current, type: event.target.value }))}
              className="ml-2 rounded-lg border border-slate-300 px-3 py-2"
            >
              {TYPES.map(type => <option key={type || 'all'} value={type}>{type || 'all types'}</option>)}
            </select>
          </label>
        </div>
        {state.error && <ErrorState message={state.error} onRetry={loadReports} />}
        {state.loading ? <LoadingState label="Loading moderation queue…" /> : !reports.length ? (
          <EmptyState title="No reports match these filters" detail="Change a filter or check back later." />
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <article key={report._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-slate-900">
                      <ShieldCheck size={18} className="text-amber-600" />
                      {report.reason?.replaceAll('_', ' ') || 'Reported content'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {report.targetType?.replaceAll('_', ' ')} · {report.targetId}
                    </p>
                    {report.detail && <p className="mt-2 max-w-3xl text-sm text-slate-700">{report.detail}</p>}
                    <p className="mt-2 text-xs text-slate-500">
                      Submitted by {report.reporter?.username || report.reporter?.email || 'member'}{' '}
                      {report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                  <label className="text-sm font-medium text-slate-700">
                    Decision
                    <select
                      value={report.status}
                      disabled={state.updating === report._id}
                      onChange={event => updateStatus(report._id, event.target.value)}
                      className="ml-2 rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
                    >
                      {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
