import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import AdminLayout from '../../../components/shared/adminLayout';
import { EmptyState, ErrorState, LoadingState } from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';
import { useAdminSession } from '../../../context/admin-session';

const EMPTY_FORM = { fullName: '', email: '', password: '', role: 'ADMIN' };
const strongEnough = value => (
  value.length >= 12
  && /[a-z]/.test(value)
  && /[A-Z]/.test(value)
  && /\d/.test(value)
  && /[^A-Za-z0-9]/.test(value)
);

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [state, setState] = useState({
    loading: true,
    error: '',
    saving: false,
    deleting: '',
    updating: '',
  });
  const {
    admin: currentAdmin,
    error: sessionError,
    isSuperAdmin,
    loading: sessionLoading,
    refresh: refreshSession,
  } = useAdminSession();

  const loadAdmins = useCallback(async () => {
    if (sessionLoading) return;
    if (!isSuperAdmin) {
      setAdmins([]);
      setState({
        loading: false,
        saving: false,
        deleting: '',
        updating: '',
        error: sessionError || 'Super administrator privileges are required.',
      });
      return;
    }
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admins');
      const values = data?.data?.admins;
      if (!Array.isArray(values)) {
        throw new Error('Vybe returned an invalid administrator list.');
      }
      setAdmins(values);
      setState({
        loading: false,
        error: '',
        saving: false,
        deleting: '',
        updating: '',
      });
    } catch (error) {
      setState({
        loading: false,
        saving: false,
        deleting: '',
        updating: '',
        error: error?.response?.data?.message || error?.message || 'Could not load admins.',
      });
    }
  }, [isSuperAdmin, sessionError, sessionLoading]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const createAdmin = async (event) => {
    event.preventDefault();
    if (!strongEnough(form.password)) {
      setState(current => ({
        ...current,
        error: 'Admin passwords need 12+ characters with uppercase, lowercase, number, and symbol.',
      }));
      return;
    }
    setState(current => ({ ...current, saving: true, error: '' }));
    try {
      const { data } = await axiosInstance.post('/admins/add', form);
      const created = data?.data?.admin;
      if (!created?._id || !['ADMIN', 'SUPER_ADMIN'].includes(created.role)) {
        throw new Error('Vybe returned an invalid administrator record.');
      }
      setAdmins(current => [created, ...current]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setState(current => ({ ...current, saving: false }));
    } catch (error) {
      setState(current => ({
        ...current,
        saving: false,
        error: error?.response?.data?.message || error?.message || 'Could not create the admin.',
      }));
    }
  };

  const deleteAdmin = async (admin) => {
    if (!isSuperAdmin || admin._id === currentAdmin?._id) return;
    if (!window.confirm(`Permanently remove admin access for ${admin.fullName}?`)) return;
    setState(current => ({ ...current, deleting: admin._id, error: '' }));
    try {
      await axiosInstance.delete(`/admins/${admin._id}`);
      setAdmins(current => current.filter(item => item._id !== admin._id));
      setState(current => ({ ...current, deleting: '' }));
    } catch (error) {
      setState(current => ({
        ...current,
        deleting: '',
        error: error?.response?.data?.message || error?.message || 'Could not remove the admin.',
      }));
    }
  };

  const updateRole = async (admin, role) => {
    if (!isSuperAdmin || role === admin.role) return;
    const verb = role === 'SUPER_ADMIN' ? 'grant' : 'remove';
    if (!window.confirm(`${verb} super-admin access for ${admin.fullName}?`)) return;
    setState(current => ({ ...current, updating: admin._id, error: '' }));
    try {
      const { data } = await axiosInstance.put(`/admins/${admin._id}`, { role });
      const updated = data?.data?.admin;
      if (
        !updated?._id
        || updated._id !== admin._id
        || !['ADMIN', 'SUPER_ADMIN'].includes(updated.role)
      ) {
        throw new Error('Vybe returned an invalid administrator record.');
      }
      setAdmins(current => current.map(item => (
        item._id === admin._id ? updated : item
      )));
      setState(current => ({ ...current, updating: '' }));
      if (admin._id === currentAdmin?._id) await refreshSession();
    } catch (error) {
      setState(current => ({
        ...current,
        updating: '',
        error: error?.response?.data?.message || error?.message || 'Could not change the admin role.',
      }));
    }
  };

  return (
    <AdminLayout title="Admins" subTitle="Manage privileged Vybe console access">
      <div className="space-y-4">
        {isSuperAdmin && <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(value => !value)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00D4AA] px-4 py-2 font-semibold text-white"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Add admin'}
          </button>
        </div>}
        {isSuperAdmin && showForm && (
          <form onSubmit={createAdmin} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Full name
              <input
                required
                minLength={2}
                maxLength={100}
                value={form.fullName}
                onChange={event => setForm(current => ({ ...current, fullName: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Temporary password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={event => setForm(current => ({ ...current, password: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <span className="mt-1 block text-xs text-slate-500">12+ characters with upper, lower, number, and symbol.</span>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Role
              <select
                value={form.role}
                onChange={event => setForm(current => ({ ...current, role: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={state.saving}
              className="rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white disabled:opacity-50 md:col-span-2"
            >
              {state.saving ? 'Creating…' : 'Create admin'}
            </button>
          </form>
        )}
        {state.error && <ErrorState message={state.error} onRetry={loadAdmins} />}
        {state.loading ? <LoadingState label="Loading admins…" /> : !admins.length ? (
          <EmptyState title="No admins found" detail="Add a trusted administrator to get started." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Admin</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Added</th><th className="px-5 py-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map(admin => (
                  <tr key={admin._id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{admin.fullName}</p>
                      <p className="text-xs text-slate-500">{admin.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <label className="sr-only" htmlFor={`role-${admin._id}`}>
                        Role for {admin.fullName}
                      </label>
                      <select
                        id={`role-${admin._id}`}
                        aria-label={`Role for ${admin.fullName}`}
                        value={admin.role}
                        disabled={state.updating === admin._id}
                        onChange={event => updateRole(admin, event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:opacity-50"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={admin._id === currentAdmin?._id || state.deleting === admin._id}
                        title={admin._id === currentAdmin?._id ? 'You cannot remove your own access' : 'Remove admin'}
                        onClick={() => deleteAdmin(admin)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                        {state.deleting === admin._id ? 'Removing…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
