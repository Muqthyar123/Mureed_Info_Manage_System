import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, UserRound, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mureed Information Management System — Choose Login" },
      {
        name: "description",
        content:
          "Sign in as Admin to manage Mureed information, or as a Mureed to view your own record.",
      },
      { property: "og:title", content: "Mureed Information Management System" },
      {
        property: "og:description",
        content: "Choose Admin Login or Mureed Login to continue.",
      },
    ],
  }),
  component: RoleSelection,
});

function RoleSelection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Welcome
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Mureed Information Management System
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Choose Login Type</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RoleCard
            to="/admin-login"
            title="Admin Login"
            description="Full management access to Mureeds, Peer, reports and users."
            icon={ShieldCheck}
            primary
          />
          <RoleCard
            to="/mureed-login"
            title="Mureed Login"
            description="Read-only access to your own registered information."
            icon={UserRound}
          />
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  to,
  title,
  description,
  icon: Icon,
  primary,
}: {
  to: string;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`surface-card group flex flex-col gap-4 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        primary ? "ring-1 ring-primary/15" : ""
      }`}
    >
      <span
        className={`inline-flex size-11 items-center justify-center rounded-xl ${
          primary ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        Continue
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
