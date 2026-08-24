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

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
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
