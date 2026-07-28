import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  ShieldCheck,
  Trash2,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../../components/shared/adminLayout';
import { EmptyState, ErrorState, LoadingState } from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';

const secureCredentialUrls = (values) => (
  (Array.isArray(values) ? values : []).flatMap((value) => {
    if (typeof value !== 'string' || value.length > 2048) return [];
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
        return [];
      }
      return [parsed.toString()];
    } catch {
      return [];
    }
  })
);

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [state, setState] = useState({ loading: true, error: '', deleting: '' });
  const [applications, setApplications] = useState([]);
  const [trainerPage, setTrainerPage] = useState(1);
  const [trainerPagination, setTrainerPagination] = useState({
    page: 1,
    pages: 0,
    total: 0,
  });
  const [trainerState, setTrainerState] = useState({
    loading: true,
    error: '',
    reviewing: '',
  });

  const loadUsers = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admin/users');
      if (!Array.isArray(data?.users)) {
        throw new Error('Vybe returned an invalid member list.');
      }
      setUsers(data.users);
      setState({ loading: false, error: '', deleting: '' });
    } catch (error) {
      setState({
        loading: false,
        deleting: '',
        error: error?.response?.data?.message || error?.message || 'Could not load members.',
      });
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadTrainerApplications = useCallback(async (signal) => {
    setTrainerState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admin/trainer-applications', {
        ...(signal ? { signal } : {}),
        params: {
          status: 'pending',
          page: trainerPage,
          limit: 100,
        },
      });
      if (!Array.isArray(data?.applications)) {
        throw new Error('Vybe returned an invalid trainer-application list.');
      }
      setApplications(data.applications);
      setTrainerPagination({
        page: Number(data?.pagination?.page) || trainerPage,
        pages: Number(data?.pagination?.pages) || 0,
        total: Number(data?.pagination?.total) || 0,
      });
      setTrainerState({ loading: false, error: '', reviewing: '' });
    } catch (error) {
      if (signal?.aborted || error?.code === 'ERR_CANCELED') return;
      setTrainerState({
        loading: false,
        reviewing: '',
        error: error?.response?.data?.message
          || error?.message
          || 'Could not load trainer applications.',
      });
    }
  }, [trainerPage]);

  useEffect(() => {
    const controller = new AbortController();
    loadTrainerApplications(controller.signal);
    return () => controller.abort();
  }, [loadTrainerApplications]);

  const reviewTrainer = async (candidate, decision) => {
    let decisionNote = '';
    if (decision === 'reject') {
      decisionNote = window.prompt(
        `Why is ${candidate.fullName || candidate.username}'s application being rejected?`,
      )?.trim() || '';
      if (decisionNote.length < 5) return;
    } else if (!window.confirm(
      `Approve ${candidate.fullName || candidate.username} as a reviewed Vybe coach?`,
    )) {
      return;
    }
    setTrainerState(current => ({
      ...current,
      reviewing: candidate._id,
      error: '',
    }));
    try {
      await axiosInstance.patch(
        `/admin/trainer-applications/${candidate._id}`,
        { decision, decisionNote },
      );
      if (applications.length === 1 && trainerPage > 1) {
        setTrainerPage(current => Math.max(1, current - 1));
      } else {
        setApplications(current => current.filter(item => item._id !== candidate._id));
        setTrainerPagination(current => ({
          ...current,
          total: Math.max(0, current.total - 1),
        }));
      }
      setTrainerState(current => ({ ...current, reviewing: '' }));
    } catch (error) {
      setTrainerState(current => ({
        ...current,
        reviewing: '',
        error: error?.response?.data?.message
          || error?.message
          || 'Could not review the trainer application.',
      }));
    }
  };

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(user => [user.fullName, user.name, user.username, user.email]
      .some(value => value?.toLowerCase().includes(needle)));
  }, [search, users]);

  const deleteUser = async (user) => {
    const label = user.fullName || user.name || user.username || user.email || 'this member';
    if (!window.confirm(`Permanently delete ${label} and all associated Vybe data?`)) return;
    setState(current => ({ ...current, deleting: user._id, error: '' }));
    try {
      await axiosInstance.delete(`/admin/users/${user._id}`);
      setUsers(current => current.filter(item => item._id !== user._id));
      setState(current => ({ ...current, deleting: '' }));
    } catch (error) {
      setState(current => ({
        ...current,
        deleting: '',
        error: error?.response?.data?.message || error?.message || 'Could not delete the member.',
      }));
    }
  };

  return (
    <AdminLayout title="Members" subTitle="Search and manage Vybe accounts">
      {state.loading ? <LoadingState label="Loading members…" /> : (
        <div className="space-y-4">
          <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Trainer applications</h2>
              <p className="text-sm text-slate-600">
                Coaches remain hidden from the marketplace until an administrator reviews their application.
              </p>
            </div>
            {trainerState.error && (
              <ErrorState
                message={trainerState.error}
                onRetry={loadTrainerApplications}
              />
            )}
            {trainerState.loading ? (
              <LoadingState label="Loading trainer applications…" />
            ) : !applications.length ? (
              <EmptyState
                title="No pending trainer applications"
                detail="New applications will appear here for review."
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {applications.map(candidate => (
                  <article
                    key={candidate._id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="font-bold text-slate-900">
                      {candidate.fullName || candidate.username}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{candidate.username} · {candidate.email}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                      {candidate.application?.experienceSummary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(candidate.application?.fields || []).map(field => (
                        <span
                          key={field}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {field.replaceAll('_', ' ')}
                        </span>
                      ))}
                    </div>
                    {secureCredentialUrls(candidate.application?.credentialUrls).length > 0 && (
                      <ul className="mt-3 space-y-1 text-xs">
                        {secureCredentialUrls(candidate.application?.credentialUrls).map(url => (
                          <li key={url}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="break-all text-emerald-700 underline"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        disabled={trainerState.reviewing === candidate._id}
                        onClick={() => reviewTrainer(candidate, 'approve')}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        <ShieldCheck size={16} /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={trainerState.reviewing === candidate._id}
                        onClick={() => reviewTrainer(candidate, 'reject')}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {!trainerState.loading && (
              trainerPagination.pages > 1 || trainerPage > 1
            ) && (
              <nav
                aria-label="Trainer application pages"
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white px-4 py-3"
              >
                <p className="text-sm text-slate-600">
                  Page {trainerPagination.page} of {trainerPagination.pages}
                  {' · '}
                  {trainerPagination.total} pending applications
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={trainerPage <= 1}
                    onClick={() => setTrainerPage(current => Math.max(1, current - 1))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={trainerPage >= trainerPagination.pages}
                    onClick={() => setTrainerPage(current => current + 1)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </section>
          {state.error && <ErrorState message={state.error} onRetry={loadUsers} />}
          <label className="relative block max-w-lg">
            <span className="sr-only">Search members</span>
            <Search className="absolute left-3 top-3 text-slate-400" size={19} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search name, username, or email"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4"
            />
          </label>
          {!filteredUsers.length ? (
            <EmptyState
              title={users.length ? 'No members match that search' : 'No members yet'}
              detail={users.length ? 'Try a different name, username, or email.' : 'New Vybe accounts will appear here.'}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Member</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-emerald-50 p-2 text-emerald-700"><UsersIcon size={16} /></span>
                          <div>
                            <p className="font-semibold text-slate-900">{user.fullName || user.name || 'Unnamed member'}</p>
                            <p className="text-xs text-slate-500">@{user.username || 'not-set'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{user.email || '—'}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          disabled={state.deleting === user._id}
                          onClick={() => deleteUser(user)}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          {state.deleting === user._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
