import { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { PUBLIC_BASE_PATH, useAdminRouter } from '../../../routing';

const strongEnough = (value) => (
  value.length >= 12
  && value.length <= 128
  && /[a-z]/.test(value)
  && /[A-Z]/.test(value)
  && /\d/.test(value)
  && /[^A-Za-z0-9]/.test(value)
);

export default function ResetAdminPassword() {
  const resetContext = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return {
      token: search.get('token') || '',
      audience: search.get('audience') === 'user' ? 'user' : 'admin',
    };
  }, []);
  const { token, audience } = resetContext;
  const isUserReset = audience === 'user';
  const endpointPrefix = isUserReset ? '/auth' : '/admins';
  const supportPath = `${PUBLIC_BASE_PATH === '/' ? '' : PUBLIC_BASE_PATH}/support`;
  const publicHomePath = PUBLIC_BASE_PATH === '/' ? '/' : `${PUBLIC_BASE_PATH}/`;
  const { navigate } = useAdminRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
    deliveryNotice: false,
  });

  const requestReset = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '', deliveryNotice: false });
    try {
      await axiosInstance.post(`${endpointPrefix}/request-reset`, { email });
      setStatus({
        loading: false,
        error: '',
        success: 'If that account exists, reset instructions have been sent.',
        deliveryNotice: true,
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.status === 429
          ? 'Too many reset requests. Wait a few minutes and try again.'
          : 'Could not request a reset. Try again or use private Support.',
        success: '',
        deliveryNotice: false,
      });
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!strongEnough(password)) {
      setStatus({
        loading: false,
        error: 'Use at least 12 characters with uppercase, lowercase, number, and symbol.',
        success: '',
        deliveryNotice: false,
      });
      return;
    }
    if (password !== confirmation) {
      setStatus({
        loading: false,
        error: 'Passwords do not match.',
        success: '',
        deliveryNotice: false,
      });
      return;
    }

    setStatus({ loading: true, error: '', success: '', deliveryNotice: false });
    try {
      await axiosInstance.post(`${endpointPrefix}/reset-password`, { token, password });
      setStatus({
        loading: false,
        error: '',
        success: 'Password updated. You can now sign in.',
        deliveryNotice: false,
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || error?.message || 'Could not reset the password.',
        success: '',
        deliveryNotice: false,
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">
          {token
            ? 'Choose a new password'
            : `Reset ${isUserReset ? 'Vybe' : 'admin'} password`}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {token
            ? 'The reset link expires after 15 minutes and can only be used once.'
            : `Enter the email address attached to your ${isUserReset ? 'Vybe' : 'admin'} account.`}
        </p>

        <form className="mt-6 space-y-4" onSubmit={token ? resetPassword : requestReset}>
          {!token ? (
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          ) : (
            <>
              <label className="block text-sm font-medium text-slate-700">
                New password
                <span className="relative mt-2 block">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 px-3 text-slate-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </>
          )}

          {status.error && <p role="alert" className="text-sm text-red-700">{status.error}</p>}
          {status.success && <p role="status" className="text-sm text-emerald-700">{status.success}</p>}
          {status.deliveryNotice && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm leading-5 text-amber-900">
              Delivery requires Vybe&apos;s email channel to be configured. If no
              message arrives, use the{' '}
              <a className="font-semibold underline" href={supportPath}>private Support page</a>.
            </p>
          )}

          <button
            type="submit"
            disabled={status.loading}
            className="w-full rounded-lg bg-[#00D4AA] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {status.loading ? 'Working…' : token ? 'Update password' : 'Send reset link'}
          </button>
          {isUserReset ? (
            <a
              href={publicHomePath}
              className="block w-full px-4 py-2 text-center text-sm font-medium text-slate-600"
            >
              Back to Vybe
            </a>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="w-full px-4 py-2 text-sm font-medium text-slate-600"
            >
              Back to sign in
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
