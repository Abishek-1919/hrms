import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";

const LoginPage = lazy(() => import("@/modules/auth/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() =>
  import("@/modules/dashboard/pages/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const TimesheetsPage = lazy(() =>
  import("@/modules/timesheets/pages/TimesheetsPage").then((module) => ({ default: module.TimesheetsPage }))
);
const NewTimesheetPage = lazy(() =>
  import("@/modules/timesheets/pages/NewTimesheetPage").then((module) => ({ default: module.NewTimesheetPage }))
);
const LeavesPage = lazy(() => import("@/modules/leaves/pages/LeavesPage").then((module) => ({ default: module.LeavesPage })));
const TeamPage = lazy(() => import("@/modules/managers/pages/TeamPage").then((module) => ({ default: module.TeamPage })));
const ApprovalsPage = lazy(() =>
  import("@/modules/managers/pages/ApprovalsPage").then((module) => ({ default: module.ApprovalsPage }))
);
const UsersPage = lazy(() => import("@/modules/admin/pages/UsersPage").then((module) => ({ default: module.UsersPage })));
const DepartmentsPage = lazy(() =>
  import("@/modules/admin/pages/DepartmentsPage").then((module) => ({ default: module.DepartmentsPage }))
);
const SettingsPage = lazy(() =>
  import("@/modules/admin/pages/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);
const ProfilePage = lazy(() =>
  import("@/modules/employees/pages/ProfilePage").then((module) => ({ default: module.ProfilePage }))
);
const EmployeeListPage = lazy(() =>
  import("@/modules/employees/pages/EmployeeListPage").then((module) => ({ default: module.EmployeeListPage }))
);
const CreateEmployeePage = lazy(() =>
  import("@/modules/employees/pages/CreateEmployeePage").then((module) => ({ default: module.CreateEmployeePage }))
);
const EmployeeDetailPage = lazy(() =>
  import("@/modules/employees/pages/EmployeeDetailPage").then((module) => ({ default: module.EmployeeDetailPage }))
);
const ForcePasswordChangePage = lazy(() =>
  import("@/modules/auth/pages/ForcePasswordChangePage").then((module) => ({ default: module.ForcePasswordChangePage }))
);
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading HRMS workspace...
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ForcePasswordChangePage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/timesheets" element={<TimesheetsPage />} />
              <Route path="/timesheets/new" element={<NewTimesheetPage />} />
              <Route path="/leaves" element={<LeavesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<ProtectedRoute allowedRoles={["manager", "admin"]} />}>
                <Route path="/team" element={<TeamPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/employees" element={<EmployeeListPage />} />
                <Route path="/admin/employees/new" element={<CreateEmployeePage />} />
                <Route path="/admin/employees/:employeeId" element={<EmployeeDetailPage />} />
                <Route path="/admin/departments" element={<DepartmentsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
