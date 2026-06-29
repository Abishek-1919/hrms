import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { useAppSelector } from "@/app/store/hooks";

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
const HRDashboardPage = lazy(() =>
  import("@/modules/hr/pages/HRDashboardPage").then((module) => ({ default: module.HRDashboardPage }))
);
const HROperationsPage = lazy(() =>
  import("@/modules/operations/pages/HROperationsPage").then((module) => ({ default: module.HROperationsPage }))
);
const HREmployeeCreatePage = lazy(() =>
  import("@/modules/operations/pages/HREmployeeCreatePage").then((module) => ({ default: module.HREmployeeCreatePage }))
);
const EmployeeProfilePage = lazy(() =>
  import("@/modules/operations/pages/EmployeeProfilePage").then((module) => ({ default: module.EmployeeProfilePage }))
);
const HRAttendancePage = lazy(() =>
  import("@/modules/operations/pages/HRWorkflowModulesPage").then((module) => ({ default: module.HRAttendancePage }))
);
const HRJobsPage = lazy(() =>
  import("@/modules/operations/pages/HRWorkflowModulesPage").then((module) => ({ default: module.HRJobsPage }))
);
const HRProjectsPage = lazy(() =>
  import("@/modules/operations/pages/HRWorkflowModulesPage").then((module) => ({ default: module.HRProjectsPage }))
);
const StakeholderDashboardPage = lazy(() =>
  import("@/modules/stakeholders/pages/StakeholderDashboardPage").then((module) => ({ default: module.StakeholderDashboardPage }))
);
const StakeholderDirectoryPage = lazy(() =>
  import("@/modules/stakeholders/pages/StakeholderDirectoryPage").then((module) => ({ default: module.StakeholderDirectoryPage }))
);
const StakeholderEmployeeDetailPage = lazy(() =>
  import("@/modules/stakeholders/pages/StakeholderEmployeeDetailPage").then((module) => ({ default: module.StakeholderEmployeeDetailPage }))
);
const StakeholderDataPage = lazy(() =>
  import("@/modules/stakeholders/pages/StakeholderDataPage").then((module) => ({ default: module.StakeholderDataPage }))
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

function HomeRedirect() {
  const user = useAppSelector((state) => state.auth.user);
  if (user?.role === "hr") return <Navigate to="/hr" replace />;
  if (user?.role === "stakeholder") return <Navigate to="/stakeholder" replace />;
  return <Navigate to="/dashboard" replace />;
}

function DashboardRoute() {
  const user = useAppSelector((state) => state.auth.user);
  if (user?.role === "hr") return <Navigate to="/hr" replace />;
  if (user?.role === "stakeholder") return <Navigate to="/stakeholder" replace />;
  return <DashboardPage />;
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
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/timesheets" element={<TimesheetsPage />} />
              <Route path="/timesheets/new" element={<NewTimesheetPage />} />
              <Route path="/leaves" element={<LeavesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<ProtectedRoute allowedRoles={["employee", "manager", "hr", "stakeholder", "admin"]} />}>
                <Route path="/employees/:employeeId/profile" element={<EmployeeProfilePage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["employee", "manager", "hr", "admin"]} />}>
                <Route path="/hr/operations" element={<HROperationsPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["manager", "admin"]} />}>
                <Route path="/team" element={<TeamPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["hr"]} />}>
                <Route path="/hr" element={<HRDashboardPage />} />
                <Route path="/hr/attendance" element={<HRAttendancePage />} />
                <Route path="/hr/jobs" element={<HRJobsPage />} />
                <Route path="/hr/projects" element={<HRProjectsPage />} />
                <Route path="/hr/employees/new" element={<CreateEmployeePage />} />
                <Route path="/hr/operations/employee-information/add" element={<HREmployeeCreatePage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["stakeholder"]} />}>
                <Route path="/stakeholder" element={<StakeholderDashboardPage />} />
                <Route path="/stakeholder/employees" element={<StakeholderDirectoryPage />} />
                <Route path="/stakeholder/employees/:employeeId" element={<StakeholderEmployeeDetailPage />} />
                <Route path="/stakeholder/data" element={<StakeholderDataPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/employees" element={<EmployeeListPage />} />
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
