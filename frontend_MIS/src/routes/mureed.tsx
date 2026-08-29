import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, IdCard } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/layout/RequireRole";

const items: NavItem[] = [
  { label: "Dashboard", to: "/mureed/dashboard", icon: LayoutDashboard },
  { label: "My Information", to: "/mureed/my-information", icon: IdCard },
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

export const Route = createFileRoute("/mureed")({
  component: MureedLayout,
  errorComponent: RouteErrorComponent,
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
