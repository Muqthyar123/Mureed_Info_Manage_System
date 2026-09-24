import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, LogOut, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface AppShellProps {
  items: NavItem[];
  children: ReactNode;
  scopeLabel: string;
}

export function AppShell({ items, children, scopeLabel }: AppShellProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("mims.sidebar.collapsed") === "true";
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("mims.sidebar.collapsed", String(next));
  };

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/", replace: true });
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "A";

  const nav = (
    <nav className={cn("flex flex-1 flex-col gap-1.5", collapsed ? "px-2 items-center" : "px-3")}>
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl transition-all duration-200",
              collapsed ? "h-10 w-10 justify-center p-0" : "px-3.5 py-2.5 text-sm font-medium",
              active
                ? "bg-primary text-primary-foreground shadow-md font-semibold"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className={cn("shrink-0", collapsed ? "size-5" : "size-4")} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col bg-sidebar py-4 select-none">
      {/* Top Header with Clickable Logo (Click logo to toggle sidebar, no chevron button) */}
      <div className={cn("flex items-center pb-4 border-b border-sidebar-border/60 px-4", collapsed && "justify-center px-2")}>
        <div
          onClick={toggleCollapsed}
          title={collapsed ? "Click logo to expand sidebar" : "Click logo to collapse sidebar"}
          className="flex items-center gap-3 min-w-0 cursor-pointer group hover:opacity-90 transition-opacity"
        >
          <img
            src="/logo.png"
            alt="MIMS Logo"
            className="h-10 w-10 shrink-0 rounded-xl bg-white p-0.5 shadow-md object-contain transition-transform group-hover:scale-105 group-active:scale-95"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-base font-bold text-sidebar-accent-foreground tracking-tight leading-none group-hover:text-primary transition-colors">
                MIMS
              </p>
              <p className="mt-1 text-xs text-sidebar-foreground/60 truncate">{scopeLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mt-3 flex-1 overflow-y-auto">
        {nav}
      </div>

      {/* Bottom Footer with Account Details just above Logout Button */}
      <div className={cn("mt-auto border-t border-sidebar-border/60 pt-3 flex flex-col gap-2", collapsed ? "px-2" : "px-3")}>
        {/* User Account Details */}
        <div className={cn("flex items-center gap-3 px-1 py-1", collapsed && "justify-center px-0")}>
          <div
            title={`${user?.name} (${user?.email})`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm shadow-sm ring-2 ring-primary/30"
          >
            {userInitial}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-sidebar-accent-foreground">{user?.name}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl transition-all duration-200 text-destructive/90 hover:bg-destructive/10 hover:text-destructive",
            collapsed ? "h-10 w-10 justify-center mx-auto" : "w-full px-3.5 py-2.5 text-sm font-medium"
          )}
        >
          <LogOut className={cn("shrink-0", collapsed ? "size-5" : "size-4")} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar Rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarInner}
      </aside>

      {/* Mobile Drawer (Always full width when opened on mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 z-10 rounded-md p-2 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
            >
              <X className="size-4" />
            </button>
            {sidebarInner}
          </div>
        </div>
      )}

      {/* Main Content View with Dynamic Left Padding */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <img src="/logo.png" alt="MIMS Logo" className="h-7 w-7 shrink-0 rounded-md object-contain" />
            <span className="font-display text-sm font-semibold">MIMS</span>
          </div>
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
            {userInitial}
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
