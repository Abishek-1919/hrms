import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/utils/cn";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <Sidebar />
      </div>
      <div className={cn("fixed inset-0 z-40 lg:hidden", mobileOpen ? "block" : "hidden")}>
        <button
          className="absolute inset-0 bg-slate-950/45"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
        <div className="relative h-full">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>
      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
