import { useCallback, useEffect, useState } from 'react';
import { History, ShieldCheck } from 'lucide-react';
import AdminLayout from '../../../components/shared/adminLayout';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';
import { useAdminSession } from '../../../context/admin-session';

export default function AuditLog() {
  const {
    error: sessionError,
    isSuperAdmin,
    loading: sessionLoading,
  } = useAdminSession();
  const [entries, setEntries] = useState([]);
  const [filters, setFilters] = useState({ action: '', targetType: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 0,
    total: 0,
  });
  const [state, setState] = useState({ loading: true, error: '' });

  const loadEntries = useCallback(async (signal) => {
    if (sessionLoading) return;
    if (!isSuperAdmin) {
      setEntries([]);
      setState({
        loading: false,
        error: sessionError || 'Super administrator privileges are required.',
      });
      return;
    }
    setState({ loading: true, error: '' });
    try {
      const { data } = await axiosInstance.get('/admins/audit-log', {
        ...(signal ? { signal } : {}),
        params: {
          page,
          limit: 100,
          ...(filters.action ? { action: filters.action } : {}),
          ...(filters.targetType ? { targetType: filters.targetType } : {}),
        },
      });
      if (!Array.isArray(data?.entries)) {
        throw new Error('Vybe returned an invalid audit-log response.');
      }
      setEntries(data.entries);
      setPagination({
        page: Number(data?.pagination?.page) || page,
        pages: Number(data?.pagination?.pages) || 0,
        total: Number(data?.pagination?.total) || 0,
      });
      setState({ loading: false, error: '' });
    } catch (error) {
      if (signal?.aborted || error?.code === 'ERR_CANCELED') return;
      setState({
        loading: false,
        error: error?.response?.data?.message || error?.message || 'Could not load the audit log.',
      });
    }
  }, [
    filters.action,
    filters.targetType,
    isSuperAdmin,
    page,
    sessionError,
    sessionLoading,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    loadEntries(controller.signal);
    return () => controller.abort();
  }, [loadEntries]);

  return (
    <AdminLayout title="Audit log" subTitle="Immutable record of privileged Vybe changes">
      <div className="space-y-4">
        {isSuperAdmin && (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Action
              <input
                value={filters.action}
                onChange={event => {
                  setPage(1);
                  setFilters(current => ({
                    ...current,
                    action: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''),
                  }));
                }}
                placeholder="REPORT_CONTENT_REMOVED"
                maxLength={80}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Target type
              <input
                value={filters.targetType}
                onChange={event => {
                  setPage(1);
                  setFilters(current => ({
                    ...current,
                    targetType: event.target.value.replace(/[^a-z0-9_]/gi, ''),
                  }));
                }}
                placeholder="user"
                maxLength={80}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        )}
        {state.error && <ErrorState message={state.error} onRetry={loadEntries} />}
        {state.loading ? <LoadingState label="Loading immutable audit events…" /> : !entries.length ? (
          <EmptyState title="No audit events match" detail="Change the filters or return after a privileged action." />
        ) : (
          <div className="space-y-3">
            {entries.map(entry => (
              <article key={entry._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-slate-900">
                      <ShieldCheck size={17} className="text-[#00A98A]" />
                      {entry.action?.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.targetType} · <span className="break-all">{entry.targetId}</span>
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {entry.actorSnapshot?.fullName || entry.actorSnapshot?.email || 'Administrator'}
                      {' · '}
                      {entry.actorSnapshot?.role?.replaceAll('_', ' ')}
                    </p>
                    {entry.metadata?.moderationNote && (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                        {entry.metadata.moderationNote}
                      </p>
                    )}
                  </div>
                  <p className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                    <History size={15} />
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown time'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
        {!state.loading && (pagination.pages > 1 || page > 1) && (
          <nav
            aria-label="Audit log pages"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages} · {pagination.total} events
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(current => Math.max(1, current - 1))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage(current => current + 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>
    </AdminLayout>
  );
}
