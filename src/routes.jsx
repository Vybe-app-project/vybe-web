import React, { Suspense, lazy, useEffect } from "react";
import AppLayout from "./components/shared/layouts";
import { AdminRouter, useAdminRouter } from "./routing";

const LoginAdmin = lazy(() => import("./pages/admin/auth"));
const ResetAdminPassword = lazy(() => import("./pages/admin/auth/reset-password"));
const AdminHome = lazy(() => import("./pages/admin/portal"));
const Admins = lazy(() => import("./pages/admin/portal/admins"));
const Users = lazy(() => import("./pages/admin/portal/users"));
const Workouts = lazy(() => import("./pages/admin/portal/workouts"));
const Reports = lazy(() => import("./pages/admin/portal/reports"));
const SupportInbox = lazy(() => import("./pages/admin/portal/support"));
const Settings = lazy(() => import("./pages/admin/portal/settings"));

const RouteLoading = () => (
  <div role="status" className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
    <span className="mr-3 h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#00D4AA]" />
    Loading Vybe…
  </div>
);

function RouteContent() {
  const { route, navigate } = useAdminRouter();
  const knownRoute = [
    '/',
    '/reset-password',
    '/home',
    '/admins',
    '/users',
    '/workouts',
    '/reports',
    '/support',
    '/settings',
  ].includes(route);

  useEffect(() => {
    if (!knownRoute) navigate('/', { replace: true });
  }, [knownRoute, navigate]);

  if (route === '/') return <LoginAdmin />;
  if (route === '/reset-password') return <ResetAdminPassword />;
  if (route === '/home') return <AppLayout><AdminHome /></AppLayout>;
  if (route === '/admins') return <AppLayout><Admins /></AppLayout>;
  if (route === '/users') return <AppLayout><Users /></AppLayout>;
  if (route === '/workouts') return <AppLayout><Workouts /></AppLayout>;
  if (route === '/reports') return <AppLayout><Reports /></AppLayout>;
  if (route === '/support') return <AppLayout><SupportInbox /></AppLayout>;
  if (route === '/settings') return <AppLayout><Settings /></AppLayout>;

  return null;
}

export default function AppRoutes() {
  return (
    <AdminRouter>
      <Suspense fallback={<RouteLoading />}>
        <RouteContent />
      </Suspense>
    </AdminRouter>
  );
}
