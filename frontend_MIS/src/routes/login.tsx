import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, UserRound } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Mureed Information Management System" },
      { name: "description", content: "Choose Super Admin, Sub Admin, or Mureed Login to continue." },
      { property: "og:title", content: "Login — MIMS" },
      { property: "og:description", content: "Choose your login type." },
    ],
  }),
  component: LoginChooser,
});

function LoginChooser() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="MIMS Emblem Logo" className="h-20 w-20 object-contain rounded-md bg-white p-1.5 shadow-sm border border-border" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">MIMS Access Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">Select your login portal to proceed</p>
        <div className="mt-6 grid gap-3">
          <Link
            to="/admin-login"
            className="surface-card flex items-center gap-3 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
          >
            <ShieldCheck className="size-5 text-amber-500" />
            <div>
              <div className="font-semibold">Super Admin Login</div>
              <div className="text-xs text-muted-foreground">Primary system management workspace</div>
            </div>
          </Link>
          <Link
            to="/sub-admin-login"
            className="surface-card flex items-center gap-3 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
          >
            <ShieldCheck className="size-5 text-indigo-500" />
            <div>
              <div className="font-semibold">Sub Admin Login</div>
              <div className="text-xs text-muted-foreground">Approved sub-administrator access</div>
            </div>
          </Link>
          <Link
            to="/mureed-login"
            className="surface-card flex items-center gap-3 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
          >
            <UserRound className="size-5 text-emerald-500" />
            <div>
              <div className="font-semibold">Mureed Login</div>
              <div className="text-xs text-muted-foreground">Personal Mureed profile portal</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

