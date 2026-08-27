import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/forms/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CREDENTIALS } from "@/services/authService";

export const Route = createFileRoute("/super-admin-login")({
  head: () => ({
    meta: [
      { title: "Super Admin Login — Mureed Information Management System" },
      {
        name: "description",
        content: "Sign in as Super Admin to manage Mureed records, Peer, reports, Sub Admins, and system settings.",
      },
      { property: "og:title", content: "Super Admin Login — MIMS" },
      { property: "og:description", content: "Super Administrator access to the primary management workspace." },
    ],
  }),
  component: SuperAdminLoginPage,
});

function SuperAdminLoginPage() {
  const { signInAdmin, signInAdminWithGoogle } = useAuth();
  const navigate = useNavigate();

  return (
    <LoginForm
      title="Super Admin Login"
      subtitle="Sign in with your primary Super Admin account."
      emailLabel="Super Admin Email"
      emailPlaceholder="aasthanakhadariyaaskariya.admin@gmail.com"
      hint={
        <>
          Super Admin Email: <strong>{DEMO_CREDENTIALS.mainAdminEmail}</strong> | Default Password:{" "}
          <strong>{DEMO_CREDENTIALS.mainAdminPassword}</strong>
        </>
      }
      submitLabel="Super Admin Login"
      onSubmit={async (email, password) => {
        await signInAdmin(email, password);
        navigate({ to: "/admin/dashboard", replace: true });
      }}
      onGoogleSubmit={async () => {
        const email = window.prompt("Mock Google login email", DEMO_CREDENTIALS.mainAdminEmail);
        if (!email) return;
        await signInAdminWithGoogle(email);
        toast.success("Google account verified", { description: email });
        navigate({ to: "/admin/dashboard", replace: true });
      }}
      footer={
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-center">
          <span className="text-sm text-muted-foreground">Looking for Sub Admin Login?</span>
          <Button asChild variant="outline" size="sm">
            <Link to="/sub-admin-login">Sub Admin Login</Link>
          </Button>
        </div>
      }
    />
  );
}
