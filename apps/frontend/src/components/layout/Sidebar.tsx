import { NavLink } from "react-router-dom";
import { Building2 } from "lucide-react";
import { navigationItems } from "@/constants/routes";
import { useAppSelector } from "@/app/store/hooks";
import { cn } from "@/utils/cn";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAppSelector((state) => state.auth.user);
  const items = navigationItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">MethodHub HRMS</p>
          <p className="text-xs text-muted-foreground">Enterprise Portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  isActive && "bg-accent text-accent-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="mt-1 text-xs capitalize text-muted-foreground">{user?.role} workspace</p>
        </div>
      </div>
    </aside>
  );
}
