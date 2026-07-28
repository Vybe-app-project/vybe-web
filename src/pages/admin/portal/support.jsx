import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Inbox, RotateCcw } from 'lucide-react';
import AdminLayout from '../../../components/shared/adminLayout';
import { EmptyState, ErrorState, LoadingState } from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';

const FILTERS = ['open', 'resolved'];

const messagesFrom = (data) => {
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.supportMessages)) return data.supportMessages;
  if (Array.isArray(data?.data?.messages)) return data.data.messages;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const updatedMessageFrom = (data, fallback) => {
  const candidates = [data?.supportMessage, data?.data, data?.message];
  const updated = candidates.find(candidate => (
    candidate && typeof candidate === 'object' && !Array.isArray(candidate)
  ));
  return updated || fallback;
};

const formattedDate = (value) => {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString();
};

export default function SupportInbox() {
  const [filter, setFilter] = useState('open');
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({ loading: true, error: '', updating: '' });

  const loadMessages = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admin/support', {
        params: { status: filter, limit: 100 },
      });
      setMessages(messagesFrom(data));
      setState({ loading: false, error: '', updating: '' });
    } catch (error) {
      setState({
        loading: false,
        updating: '',
        error: error?.response?.data?.message || error?.message || 'Could not load support requests.',
      });
    }
  }, [filter]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const updateStatus = async (supportMessage, status) => {
    setState(current => ({ ...current, updating: supportMessage._id, error: '' }));
    try {
      const { data } = await axiosInstance.patch(
        `/admin/support/${supportMessage._id}`,
        { status },
      );
      const updated = updatedMessageFrom(data, { ...supportMessage, status });
      setMessages(current => (
        status === filter
          ? current.map(item => (item._id === supportMessage._id ? updated : item))
          : current.filter(item => item._id !== supportMessage._id)
      ));
      setState(current => ({ ...current, updating: '' }));
    } catch (error) {
      setState(current => ({
        ...current,
        updating: '',
        error: error?.response?.data?.message || error?.message || 'Could not update the support request.',
      }));
    }
  };

  return (
    <AdminLayout title="Support inbox" subTitle="Review private member and visitor requests">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Inbox size={18} className="text-emerald-600" />
            Private requests
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1" aria-label="Support status filter">
            {FILTERS.map(status => (
              <button
                key={status}
                type="button"
                aria-pressed={filter === status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                  filter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {state.error && <ErrorState message={state.error} onRetry={loadMessages} />}
        {state.loading ? (
          <LoadingState label={`Loading ${filter} support requests…`} />
        ) : !messages.length ? (
          <EmptyState
            title={`No ${filter} support requests`}
            detail={filter === 'open'
              ? 'New private requests will appear here.'
              : 'Resolved requests will remain available for review.'}
          />
        ) : (
          <div className="space-y-3">
            {messages.map(supportMessage => {
              const nextStatus = filter === 'open' ? 'resolved' : 'open';
              const updating = state.updating === supportMessage._id;
              return (
                <article
                  key={supportMessage._id}
                  aria-label={`Support request from ${supportMessage.fullName || 'visitor'}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="font-semibold text-slate-900">
                          {supportMessage.fullName || 'Unnamed visitor'}
                        </h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          filter === 'open'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                        >
                          {supportMessage.status || filter}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-600">
                        {supportMessage.email || 'Email unavailable'}
                      </p>
                      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                        {supportMessage.message || 'No message content.'}
                      </p>
                      <p className="mt-4 text-xs text-slate-500">
                        Received {formattedDate(supportMessage.createdAt)}
                        {supportMessage.resolvedAt
                          ? ` · Resolved ${formattedDate(supportMessage.resolvedAt)}`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => updateStatus(supportMessage, nextStatus)}
                      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-50 ${
                        nextStatus === 'resolved'
                          ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                          : 'bg-slate-800 text-white hover:bg-slate-900'
                      }`}
                    >
                      {nextStatus === 'resolved' ? <CheckCircle2 size={17} /> : <RotateCcw size={17} />}
                      {updating
                        ? 'Updating…'
                        : nextStatus === 'resolved'
                          ? 'Resolve'
                          : 'Reopen'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
