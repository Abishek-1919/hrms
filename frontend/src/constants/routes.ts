import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCog,
  Database,
  Users,
  UserPlus,
  UserRound
} from "lucide-react";
import type { Role } from "@hrms/shared-types";

export interface NavigationItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["employee", "manager", "admin"] },
  { label: "HR Dashboard", path: "/hr", icon: UserCog, roles: ["hr"] },
  { label: "HR Operations", path: "/hr/operations", icon: BriefcaseBusiness, roles: ["hr", "admin"] },
  { label: "Attendance", path: "/hr/attendance", icon: Clock3, roles: ["hr"] },
  { label: "Jobs", path: "/hr/jobs", icon: BriefcaseBusiness, roles: ["hr"] },
  { label: "Projects", path: "/hr/projects", icon: ClipboardCheck, roles: ["hr"] },
  { label: "Add Employee", path: "/hr/operations/employee-information/add", icon: UserPlus, roles: ["hr"] },
  { label: "Stakeholder Dashboard", path: "/stakeholder", icon: LayoutDashboard, roles: ["stakeholder"] },
  { label: "Employee Search", path: "/stakeholder/employees", icon: Users, roles: ["stakeholder"] },
  { label: "Headcount Data", path: "/stakeholder/data", icon: Database, roles: ["stakeholder"] },
  { label: "Timesheets", path: "/timesheets", icon: Clock3, roles: ["employee", "manager"] },
  { label: "Leaves", path: "/leaves", icon: CalendarDays, roles: ["employee", "manager"] },
  { label: "Teams", path: "/team", icon: Users, roles: ["manager", "admin"] },
  { label: "Approvals", path: "/approvals", icon: ClipboardCheck, roles: ["manager"] },
  { label: "Users", path: "/admin/users", icon: ShieldCheck, roles: ["admin"] },
  { label: "Employees", path: "/admin/employees", icon: UserPlus, roles: ["admin"] },
  { label: "Departments", path: "/admin/departments", icon: BriefcaseBusiness, roles: ["admin"] },
  { label: "Permissions", path: "/admin/settings", icon: Settings, roles: ["admin"] },
  { label: "Profile", path: "/profile", icon: UserRound, roles: ["employee", "manager", "hr", "stakeholder", "admin"] }
];

export const dashboardTabs = [
  { label: "Headcount", value: "248", icon: Users },
  { label: "Utilization", value: "86%", icon: BarChart3 },
  { label: "Open approvals", value: "18", icon: ClipboardCheck }
];
