import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Network,
  BarChart3,
  UserCog,
  Settings,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/layout/RequireRole";

const items: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Mureeds", to: "/admin/mureeds", icon: Users },
  { label: "Peer", to: "/admin/peer", icon: Network },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "User Management", to: "/admin/users", icon: UserCog },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

function RouteErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="surface-card p-6 text-center">
      <h2 className="text-lg font-semibold text-foreground">Content Error</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error?.message || "Could not load this page."}</p>
      <button
        onClick={reset}
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  errorComponent: RouteErrorComponent,
});

function AdminLayout() {
  return (
    <RequireRole role="Admin">
      <AppShell items={items} scopeLabel="Admin Workspace">
        <Outlet />
      </AppShell>
    </RequireRole>
  );
}
