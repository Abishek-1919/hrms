import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
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
  { label: "Timesheets", path: "/timesheets", icon: Clock3, roles: ["employee", "manager", "admin"] },
  { label: "Leaves", path: "/leaves", icon: CalendarDays, roles: ["employee", "manager", "admin"] },
  { label: "Team", path: "/team", icon: Users, roles: ["manager", "admin"] },
  { label: "Approvals", path: "/approvals", icon: ClipboardCheck, roles: ["manager", "admin"] },
  { label: "Users", path: "/admin/users", icon: ShieldCheck, roles: ["admin"] },
  { label: "Departments", path: "/admin/departments", icon: BriefcaseBusiness, roles: ["admin"] },
  { label: "Permissions", path: "/admin/settings", icon: Settings, roles: ["admin"] },
  { label: "Profile", path: "/profile", icon: UserRound, roles: ["employee", "manager", "admin"] }
];

export const dashboardTabs = [
  { label: "Headcount", value: "248", icon: Users },
  { label: "Utilization", value: "86%", icon: BarChart3 },
  { label: "Open approvals", value: "18", icon: ClipboardCheck }
];
