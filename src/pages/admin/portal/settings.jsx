import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/shared/adminLayout';
import { ErrorState, LoadingState } from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';
import { useAdminRouter } from '../../../routing';

export default function Settings() {
  const { navigate } = useAdminRouter();
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [state, setState] = useState({ loading: true, saving: false, error: '', success: '' });

  const loadAdmin = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admins/me');
      const profile = data?.data?.admin;
      setAdmin(profile);
      setForm({ fullName: profile?.fullName || '', email: profile?.email || '' });
      window.localStorage.setItem('admin_profile', JSON.stringify(profile || {}));
      setState({ loading: false, saving: false, error: '', success: '' });
    } catch (error) {
      setState({
        loading: false,
        saving: false,
        success: '',
        error: error?.response?.data?.message || error?.message || 'Could not load your admin profile.',
      });
    }
  }, []);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setState(current => ({ ...current, saving: true, error: '', success: '' }));
    try {
      const { data } = await axiosInstance.put(`/admins/${admin._id}`, form);
      const profile = data?.data?.admin || { ...admin, ...form };
      setAdmin(profile);
      window.localStorage.setItem('admin_profile', JSON.stringify(profile));
      setState(current => ({ ...current, saving: false, success: 'Profile saved.' }));
    } catch (error) {
      setState(current => ({
        ...current,
        saving: false,
        error: error?.response?.data?.message || error?.message || 'Could not save your profile.',
      }));
    }
  };

  return (
    <AdminLayout title="Settings" subTitle="Manage your administrator profile and security">
      {state.loading ? <LoadingState label="Loading settings…" /> : state.error && !admin ? (
        <ErrorState message={state.error} onRetry={loadAdmin} />
      ) : (
        <div className="max-w-2xl space-y-5">
          {state.error && <ErrorState message={state.error} />}
          {state.success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{state.success}</p>}
          <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Profile</h2>
            <label className="block text-sm font-medium text-slate-700">
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
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <p className="text-sm text-slate-500">Role: {admin?.role?.replace('_', ' ') || 'Admin'}</p>
            <button
              type="submit"
              disabled={state.saving}
              className="rounded-lg bg-[#00D4AA] px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {state.saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Password</h2>
            <p className="mt-1 text-sm text-slate-600">Send a one-time, 15-minute reset link to your verified admin email.</p>
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
            >
              Reset password
            </button>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
