import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import axiosInstance from "../../../config/axios";
import { useAdminRouter } from "../../../routing";
import { getAdminToken, setAdminToken } from "../../../utils/adminAuthStorage";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { navigate } = useAdminRouter();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setFeedback("");
    try {
      const response = await axiosInstance.post('/admins/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const token = response?.data?.data?.token;
      const admin = response?.data?.data?.admin;
      if (
        typeof token !== 'string'
        || !token.trim()
        || !admin?._id
        || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)
      ) {
        throw new Error('Vybe returned an invalid administrator session.');
      }

      setAdminToken(token);
      navigate('/home', { replace: true });
    } catch (error) {
      setFeedback(
        error?.response?.data?.message
        || error?.message
        || 'Could not sign in.',
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

    useEffect(() => {
    const token = getAdminToken();
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,212,170,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_34%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="w-full">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00D4AA] text-slate-950 shadow-[0_18px_50px_rgba(0,212,170,0.28)]">
              <ShieldCheck aria-hidden="true" className="h-7 w-7" strokeWidth={2.3} />
            </div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#65e4ca]">
              Vybe operations
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Admin Login
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to manage the Vybe community securely.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/25 sm:p-8"
          >
            {feedback && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {feedback}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={`block min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 focus:border-[#00a888] focus:ring-[#00D4AA]/20'
                  }`}
                  placeholder="Enter your email"
                  value={email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'admin-email-error' : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFeedback("");
                    if (errors.email) {
                      setErrors((previous) => ({ ...previous, email: '' }));
                    }
                  }}
                />
                {errors.email && (
                  <p id="admin-email-error" role="alert" className="mt-2 text-sm font-medium text-red-700">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="pass" className="mb-2 block text-sm font-semibold text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="pass"
                    required
                    autoComplete="current-password"
                    className={`block min-h-12 w-full rounded-xl border bg-white py-3 pl-4 pr-12 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                        : 'border-slate-300 focus:border-[#00a888] focus:ring-[#00D4AA]/20'
                    }`}
                    placeholder="Enter your password"
                    value={password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'admin-password-error' : undefined}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setFeedback("");
                      if (errors.password) {
                        setErrors((previous) => ({ ...previous, password: '' }));
                      }
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center rounded-r-xl text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00a888]"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Eye aria-hidden="true" className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="admin-password-error" role="alert" className="mt-2 text-sm font-medium text-red-700">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="cursor-pointer text-sm font-semibold text-[#007d68] underline decoration-transparent underline-offset-4 transition hover:decoration-current focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a888] focus-visible:ring-offset-2"
                onClick={() => navigate("/reset-password")}
              >
                Reset password
              </button>
            </div>

            <button
              disabled={loading}
              aria-busy={loading}
              type="submit"
              className="group flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00b894] px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-teal-600/20 transition hover:-translate-y-0.5 hover:bg-[#00d4aa] hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#00D4AA]/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>

            <p className="text-center text-xs leading-5 text-slate-500">
              Authorized administrators only. Sessions end when this browser tab closes.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
