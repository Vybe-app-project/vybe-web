import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Users as UsersIcon } from 'lucide-react';
import AdminLayout from '../../../components/shared/adminLayout';
import { EmptyState, ErrorState, LoadingState } from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [state, setState] = useState({ loading: true, error: '', deleting: '' });

  const loadUsers = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admin/users');
      setUsers(data?.users || []);
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
