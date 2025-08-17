import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdmin from "./pages/admin/auth";
import AdminHome from "./pages/admin/portal";
import AppLayout from "./components/shared/layouts";
import Workouts from "./pages/admin/portal/workouts";

export default function AppRoutes() {
  return (
      <BrowserRouter basename="/admin">
    <Routes>
      <Route path="/" element={<LoginAdmin />} />
            <Route path="/home" element={<AppLayout><AdminHome /></AppLayout>} />
      <Route path="/workouts" element={<AppLayout><Workouts /></AppLayout>} />
    </Routes>
</BrowserRouter>
  );
}
