import { NavLink } from "react-router-dom";
import { BrandLogo } from "@/components/common/BrandLogo";
import { navigationItems } from "@/constants/routes";
import { useAppSelector } from "@/app/store/hooks";
import { cn } from "@/utils/cn";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAppSelector((state) => state.auth.user);
  const items = navigationItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="flex h-full w-72 flex-col border-r border-[color:var(--border-soft)] [background:var(--sidebar-bg)] text-foreground backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 border-b border-[color:var(--border-soft)] px-5">
        <BrandLogo className="h-10 w-20 shrink-0" />
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
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-[color:var(--nav-hover-bg)] hover:text-foreground [&_svg]:text-muted-foreground",
                  isActive && "border border-[color:var(--nav-active-border)] [background:var(--nav-active-bg)] text-foreground shadow-[var(--panel-shadow)] [&_svg]:text-[color:var(--accent-primary)]"
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-[color:var(--border-soft)] p-4">
        <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--bg-elevated)] p-3 shadow-[var(--field-shadow)]">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="mt-1 text-xs capitalize text-muted-foreground">{user?.role} workspace</p>
        </div>
      </div>
    </aside>
  );
}
