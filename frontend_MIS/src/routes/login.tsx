import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, UserRound } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Mureed Information Management System" },
      { name: "description", content: "Choose Admin Login or Mureed Login to continue." },
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
        <h1 className="text-2xl font-semibold tracking-tight">Choose Login Type</h1>
        <div className="mt-6 grid gap-3">
          <Link
            to="/admin-login"
            className="surface-card flex items-center gap-3 p-4 text-left hover:border-primary/40"
          >
            <ShieldCheck className="size-5 text-primary" />
            <span className="font-medium">Admin Login</span>
          </Link>
          <Link
            to="/mureed-login"
            className="surface-card flex items-center gap-3 p-4 text-left hover:border-primary/40"
          >
            <UserRound className="size-5 text-primary" />
            <span className="font-medium">Mureed Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
