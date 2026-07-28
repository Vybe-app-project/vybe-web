import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/shared/adminLayout';
import { ErrorState, LoadingState } from '../../../components/shared/resource-state';
import axiosInstance from '../../../config/axios';
import { useAdminSession } from '../../../context/admin-session';
import { useAdminRouter } from '../../../routing';
import { clearAdminSession } from '../../../utils/adminAuthStorage';

export default function Settings() {
  const { navigate } = useAdminRouter();
  const { refresh: refreshSession } = useAdminSession();
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [state, setState] = useState({ loading: true, saving: false, error: '', success: '' });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmation: '',
  });
  const [passwordState, setPasswordState] = useState({
    saving: false,
    error: '',
  });

  const passwordIsStrong = value => (
    value.length >= 12
    && value.length <= 128
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value)
  );

  const loadAdmin = useCallback(async () => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await axiosInstance.get('/admins/me');
      const profile = data?.data?.admin;
      setAdmin(profile);
      setForm({ fullName: profile?.fullName || '', email: profile?.email || '' });
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
      await refreshSession();
      setState(current => ({ ...current, saving: false, success: 'Profile saved.' }));
    } catch (error) {
      setState(current => ({
        ...current,
        saving: false,
        error: error?.response?.data?.message || error?.message || 'Could not save your profile.',
      }));
    }
  };

  const changePassword = async event => {
    event.preventDefault();
    if (!passwordIsStrong(passwords.newPassword)) {
      setPasswordState({
        saving: false,
        error: 'Use 12–128 characters with uppercase, lowercase, number, and symbol.',
      });
      return;
    }
    if (passwords.newPassword !== passwords.confirmation) {
      setPasswordState({ saving: false, error: 'The new passwords do not match.' });
      return;
    }
    if (passwords.currentPassword === passwords.newPassword) {
      setPasswordState({ saving: false, error: 'Choose a different new password.' });
      return;
    }

    setPasswordState({ saving: true, error: '' });
    try {
      await axiosInstance.put('/admins/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      clearAdminSession();
      navigate('/', { replace: true });
    } catch (error) {
      setPasswordState({
        saving: false,
        error: error?.response?.data?.message || error?.message || 'Could not change your password.',
      });
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
          <form onSubmit={changePassword} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Password</h2>
            <p className="mt-1 text-sm text-slate-600">Changing your password immediately signs out every existing admin session.</p>
            {passwordState.error && <ErrorState message={passwordState.error} />}
            <label className="block text-sm font-medium text-slate-700">
              Current password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={event => setPasswords(current => ({ ...current, currentPassword: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              New password
              <input
                required
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={event => setPasswords(current => ({ ...current, newPassword: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <span className="mt-1 block text-xs text-slate-500">12+ characters with uppercase, lowercase, number, and symbol.</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Confirm new password
              <input
                required
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                value={passwords.confirmation}
                onChange={event => setPasswords(current => ({ ...current, confirmation: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={passwordState.saving}
                className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {passwordState.saving ? 'Updating…' : 'Change password'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
              >
                Forgot current password
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
