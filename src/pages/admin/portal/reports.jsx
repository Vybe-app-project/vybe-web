import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../../components/shared/adminLayout';
import { EmptyState, ErrorState, LoadingState } from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';
import { API_BASE_URL } from '../../../config/env';

const STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed'];
const TYPES = [
  { label: 'all targets', value: '' },
  { label: 'posts', value: 'post' },
  { label: 'meals', value: 'meal' },
  { label: 'workouts', value: 'workout' },
  { label: 'workout plans', value: 'workout_plan' },
  { label: 'profiles', value: 'user' },
];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ status: 'pending', type: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    page: 1,
    total: 0,
  });
  const [state, setState] = useState({ loading: true, error: '', updating: '' });
  const [notes, setNotes] = useState({});

  const loadReports = useCallback(async (signal) => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admin/reports', {
        ...(signal ? { signal } : {}),
        params: {
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.type ? { type: filters.type } : {}),
          page,
          limit: 100,
        },
      });
      if (!Array.isArray(data?.reports)) {
        throw new Error('Vybe returned an invalid moderation response.');
      }
      setReports(data.reports);
      setPagination({
        hasNextPage: Boolean(data?.hasNextPage),
        page: Number(data?.page) || page,
        total: Number(data?.total) || 0,
      });
      setState({ loading: false, error: '', updating: '' });
    } catch (error) {
      if (signal?.aborted || error?.code === 'ERR_CANCELED') return;
      setState({
        loading: false,
        updating: '',
        error: error?.response?.data?.message || error?.message || 'Could not load reports.',
      });
    }
  }, [filters.status, filters.type, page]);

  useEffect(() => {
    const controller = new AbortController();
    loadReports(controller.signal);
    return () => controller.abort();
  }, [loadReports]);

  const enforceAction = async (report, action) => {
    const note = String(notes[report._id] || '').trim();
    if (['remove_content', 'suspend_user'].includes(action) && note.length < 5) {
      setState(current => ({
        ...current,
        error: 'Add a short moderation reason before removing content or suspending a member.',
      }));
      return;
    }
    const confirmations = {
      remove_content: 'Remove this content from Vybe? This action cannot be undone from the console.',
      suspend_user: 'Suspend this member and revoke every active session?',
      restore_user: 'Restore this member’s access to Vybe?',
    };
    if (confirmations[action] && !window.confirm(confirmations[action])) return;

    setState(current => ({ ...current, updating: report._id, error: '' }));
    try {
      const { data } = await axiosInstance.patch(
        `/admin/reports/${report._id}`,
        { action, ...(note ? { note } : {}) },
      );
      const updated = data?.report;
      if (filters.status && updated?.status !== filters.status) {
        setReports(current => current.filter(item => item._id !== report._id));
      } else {
        setReports(current => current.map(item => (
          item._id === report._id ? updated : item
        )));
      }
      setNotes(current => ({ ...current, [report._id]: '' }));
      setState(current => ({ ...current, updating: '' }));
    } catch (error) {
      setState(current => ({
        ...current,
        updating: '',
        error: error?.response?.data?.message || error?.message || 'Could not update the report.',
      }));
    }
  };

  const previewImage = value => {
    try {
      const parsed = new URL(value);
      const localDevelopmentImage = (
        import.meta.env.DEV
        && parsed.protocol === 'http:'
        && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)
      );
      const configuredApiOrigin = API_BASE_URL
        ? new URL(API_BASE_URL).origin
        : '';
      const trustedProductionImage = (
        import.meta.env.PROD
        && parsed.protocol === 'https:'
        && parsed.origin === configuredApiOrigin
      );
      return (
        !parsed.username
        && !parsed.password
        && (
          trustedProductionImage
          || (!import.meta.env.PROD && parsed.protocol === 'https:')
          || localDevelopmentImage
        )
      )
        ? parsed.toString()
        : '';
    } catch {
      return '';
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
              onChange={event => {
                setPage(1);
                setFilters(current => ({ ...current, status: event.target.value }));
              }}
              className="ml-2 rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">All</option>
              {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Target
            <select
              value={filters.type}
              onChange={event => {
                setPage(1);
                setFilters(current => ({ ...current, type: event.target.value }));
              }}
              className="ml-2 rounded-lg border border-slate-300 px-3 py-2"
            >
              {TYPES.map(type => (
                <option key={type.value || 'all'} value={type.value}>
                  {type.label}
                </option>
              ))}
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
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-slate-900">
                      <ShieldCheck size={18} className="text-amber-600" />
                      {report.reason?.replaceAll('_', ' ') || 'Reported content'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {report.targetType?.replaceAll('_', ' ')} · report {report.status}
                    </p>
                    {report.detail && <p className="mt-2 max-w-3xl text-sm text-slate-700">{report.detail}</p>}
                    <p className="mt-2 text-xs text-slate-500">
                      Submitted by {report.reporter?.username || report.reporter?.email || 'member'}{' '}
                      {report.createdAt ? new Date(report.createdAt).toLocaleString() : ''}
                    </p>
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex gap-4 p-4">
                        {previewImage(report.targetPreview?.imageUrl) && (
                          <img
                            src={previewImage(report.targetPreview.imageUrl)}
                            alt={`Preview of reported ${report.targetType?.replaceAll('_', ' ') || 'target'}`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="h-20 w-20 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                            <Eye size={16} className="text-slate-500" />
                            {report.targetPreview?.title || 'Content no longer available'}
                            {report.targetPreview?.removed && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                Removed snapshot
                              </span>
                            )}
                          </p>
                          {report.targetPreview?.body && (
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                              {report.targetPreview.body}
                            </p>
                          )}
                          <p className="mt-2 break-all text-xs text-slate-500">
                            Target {report.targetPreview?.id || report.targetId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">Enforce a decision</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Decisions are enforced by the API and recorded in the immutable admin audit log.
                    </p>
                    <label className="mt-4 block text-sm font-medium text-slate-700">
                      Moderation note
                      <textarea
                        value={notes[report._id] || ''}
                        onChange={event => setNotes(current => ({
                          ...current,
                          [report._id]: event.target.value,
                        }))}
                        maxLength={1000}
                        rows={3}
                        placeholder="Required for removal or suspension"
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={state.updating === report._id || report.status === 'actioned'}
                        onClick={() => enforceAction(report, 'mark_reviewed')}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                      >
                        <CheckCircle2 size={16} />
                        Mark reviewed
                      </button>
                      <button
                        type="button"
                        disabled={state.updating === report._id || report.status === 'actioned'}
                        onClick={() => enforceAction(report, 'dismiss')}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                      >
                        <XCircle size={16} />
                        Dismiss
                      </button>
                      {report.targetType !== 'user' && (
                        <button
                          type="button"
                          disabled={
                            state.updating === report._id
                            || report.status === 'actioned'
                            || report.targetPreview?.removed
                          }
                          onClick={() => enforceAction(report, 'remove_content')}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                          Remove content
                        </button>
                      )}
                      {report.targetOwner?.suspended ? (
                        <button
                          type="button"
                          disabled={state.updating === report._id}
                          onClick={() => enforceAction(report, 'restore_user')}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                          <UserCheck size={16} />
                          Restore member
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            state.updating === report._id
                            || report.status === 'actioned'
                            || !report.targetOwner
                          }
                          onClick={() => enforceAction(report, 'suspend_user')}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                          <UserX size={16} />
                          Suspend member
                        </button>
                      )}
                    </div>
                    {report.moderationAction && (
                      <p className="mt-3 text-xs font-medium text-slate-600">
                        Last enforced action: {report.moderationAction.replaceAll('_', ' ')}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {!state.loading && (pagination.total > reports.length || page > 1) && (
          <nav
            aria-label="Moderation queue pages"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <p className="text-sm text-slate-600">
              Page {pagination.page} · {pagination.total} total reports
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
                disabled={!pagination.hasNextPage}
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
