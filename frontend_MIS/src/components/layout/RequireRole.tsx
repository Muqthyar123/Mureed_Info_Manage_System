import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

/** Frontend route protection for the prototype (backend will enforce this too). */
export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  const isAllowed = Boolean(
    user && (
      role === "Admin"
        ? ["Admin", "SUB_ADMIN", "SUPER_ADMIN", "MAIN_ADMIN"].includes(user.role) ||
          ["Admin", "SUB_ADMIN", "SUPER_ADMIN", "MAIN_ADMIN"].includes(user.adminRole || "")
        : ["Mureed", "MUREED"].includes(user.role)
    )
  );

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: role === "Admin" ? "/admin-login" : "/mureed-login", replace: true });
    } else if (!isAllowed) {
      const target = ["Admin", "SUB_ADMIN", "SUPER_ADMIN", "MAIN_ADMIN"].includes(user.role) ||
        ["Admin", "SUB_ADMIN", "SUPER_ADMIN", "MAIN_ADMIN"].includes(user.adminRole || "")
        ? "/admin/dashboard"
        : "/mureed/dashboard";
      navigate({ to: target, replace: true });
    }
  }, [ready, user, role, isAllowed, navigate]);

  if (!ready || !user || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
