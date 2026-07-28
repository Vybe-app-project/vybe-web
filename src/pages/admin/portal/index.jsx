import { useCallback, useEffect, useState } from "react";
import { Activity, Dumbbell, MessageSquareWarning, Salad, Users } from "lucide-react";
import AdminLayout from "../../../components/shared/adminLayout";
import { ErrorState, LoadingState } from "../../../components/shared/resource-state";
import axiosInstance from "../../../config/axios";
import { useAdminRouter } from "../../../routing";

export default function AdminHome(){
    const [state, setState] = useState({ loading: true, error: '', analytics: null, reports: [] });
    const { navigate } = useAdminRouter();

    const loadDashboard = useCallback(async () => {
      setState(current => ({ ...current, loading: true, error: '' }));
      try {
        const [analyticsResponse, reportsResponse] = await Promise.all([
          axiosInstance.get('/admin/analytics'),
          axiosInstance.get('/admin/reports', { params: { status: 'pending', limit: 5 } }),
        ]);
        setState({
          loading: false,
          error: '',
          analytics: analyticsResponse.data,
          reports: reportsResponse.data?.reports || [],
        });
      } catch (error) {
        setState(current => ({
          ...current,
          loading: false,
          error: error?.response?.data?.message || error?.message || 'Could not load dashboard data.',
        }));
      }
    }, []);

    useEffect(() => {
      loadDashboard();
    }, [loadDashboard]);

    const cards = state.analytics ? [
      { label: 'Members', value: state.analytics.userCount, icon: Users },
      { label: 'Posts', value: state.analytics.postCount, icon: Activity },
      { label: 'Workouts', value: state.analytics.workoutCount, icon: Dumbbell },
      { label: 'Meals', value: state.analytics.mealCount, icon: Salad },
    ] : [];

    return (
     <AdminLayout subTitle="Live community and moderation overview" title="Dashboard">
        {state.loading ? <LoadingState label="Loading dashboard…" /> : state.error ? (
          <ErrorState message={state.error} onRetry={loadDashboard} />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ label, value, icon: Icon }) => (
                <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <Icon className="text-[#00D4AA]" size={20} />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{Number(value || 0).toLocaleString()}</p>
                </article>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Active in 7 days</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {Number(state.analytics?.active7d || 0).toLocaleString()}
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Active in 30 days</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {Number(state.analytics?.active30d || 0).toLocaleString()}
                </p>
              </article>
            </div>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 font-bold text-slate-900">
                    <MessageSquareWarning size={20} className="text-amber-600" />
                    Pending moderation
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {state.reports.length
                      ? `${state.reports.length} oldest pending reports shown`
                      : 'No reports are waiting for review.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Open queue
                </button>
              </div>
            </section>
          </div>
        )}
     </AdminLayout>
    )
}
