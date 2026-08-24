import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, IdCard } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/layout/RequireRole";

const items: NavItem[] = [
  { label: "Dashboard", to: "/mureed/dashboard", icon: LayoutDashboard },
  { label: "My Information", to: "/mureed/my-information", icon: IdCard },
];

export const Route = createFileRoute("/mureed")({
  component: MureedLayout,
});

function MureedLayout() {
  return (
    <RequireRole role="Mureed">
      <AppShell items={items} scopeLabel="Mureed Portal">
        <Outlet />
      </AppShell>
    </RequireRole>
  );
}
