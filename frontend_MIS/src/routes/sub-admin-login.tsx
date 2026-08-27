import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/forms/LoginForm";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/sub-admin-login")({
  head: () => ({
    meta: [
      { title: "Sub Admin Login — Mureed Information Management System" },
      { name: "description", content: "Sign in as Sub Admin to manage Mureed records." },
      { property: "og:title", content: "Sub Admin Login — MIMS" },
      { property: "og:description", content: "Sub Administrator access to the management workspace." },
    ],
  }),
  component: SubAdminLoginPage,
});

function SubAdminLoginPage() {
  const { signInSubAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <LoginForm
      title="Sub Admin Login"
      subtitle="Sign in with your approved Sub Admin credentials."
      emailLabel="Email"
      emailPlaceholder="subadmin@mims.app"
      submitLabel="Sub Admin Login"
      onSubmit={async (email, password) => {
        const user = await signInSubAdmin(email, password);
        toast.success("Sub Admin logged in", { description: user.email });
        navigate({ to: "/admin/dashboard", replace: true });
      }}
      footer={
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-center">
          <span className="text-sm text-muted-foreground">Need a Sub Admin account?</span>
          <Button asChild variant="outline" size="sm">
            <Link to="/sub-admin-signup">Apply for Sub Admin Access</Link>
          </Button>
        </div>
      }
    />
  );
}
