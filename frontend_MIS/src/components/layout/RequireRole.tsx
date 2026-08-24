import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

/** Frontend route protection for the prototype (backend will enforce this too). */
export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: role === "Admin" ? "/admin-login" : "/mureed-login", replace: true });
    } else if (user.role !== role) {
      navigate({
        to: user.role === "Admin" ? "/admin/dashboard" : "/mureed/dashboard",
        replace: true,
      });
    }
  }, [ready, user, role, navigate]);

  if (!ready || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
