import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/forms/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CREDENTIALS } from "@/services/authService";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login - Mureed Information Management System" },
      {
        name: "description",
        content: "Sign in as Admin to manage Mureed records, Peer, reports and user accounts.",
      },
      { property: "og:title", content: "Admin Login - MIMS" },
      { property: "og:description", content: "Administrator access to the management workspace." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { signInAdmin, signInAdminWithGoogle } = useAuth();
  const navigate = useNavigate();

  return (
    <LoginForm
      title="Admin Login"
      subtitle="Sign in with your administrator account."
      emailLabel="Email"
      emailPlaceholder="admin@mims.app"
      hint={
        <>
          Demo credentials - Admin: <strong>{DEMO_CREDENTIALS.adminEmail}</strong> /{" "}
          <strong>{DEMO_CREDENTIALS.adminPassword}</strong>. Main Admin:{" "}
          <strong>{DEMO_CREDENTIALS.mainAdminEmail}</strong> /{" "}
          <strong>{DEMO_CREDENTIALS.mainAdminPassword}</strong>. Mock OTP:{" "}
          <strong>{DEMO_CREDENTIALS.mockOtp}</strong>
        </>
      }
      submitLabel="Admin Login"
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
          <span className="text-sm text-muted-foreground">New Admin?</span>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin-signup">Sign Up</Link>
          </Button>
        </div>
      }
    />
  );
}
