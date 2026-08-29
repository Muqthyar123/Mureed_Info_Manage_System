import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoginForm } from "@/components/forms/LoginForm";
import { useAuth } from "@/context/AuthContext";

import { toast } from "sonner";

export const Route = createFileRoute("/mureed-login")({
  head: () => ({
    meta: [
      { title: "Mureed Login — Mureed Information Management System" },
      {
        name: "description",
        content: "Sign in with your registered email to view your own Mureed information.",
      },
      { property: "og:title", content: "Mureed Login — MIMS" },
      { property: "og:description", content: "Read-only access to your registered information." },
    ],
  }),
  component: MureedLoginPage,
});

function MureedLoginPage() {
  const { signInMureed } = useAuth();
  const navigate = useNavigate();

  return (
    <LoginForm
      title="Mureed Login"
      subtitle="Use the email registered for you by the Admin."
      emailLabel="Registered Email"
      emailPlaceholder="mureed@example.com"
      onSubmit={async (email, password) => {
        const user = await signInMureed(email, password);
        if (user.accountStatus === "PASSWORD_CHANGE_REQUIRED") {
          toast.info("Password change required", { description: "Please set a new password for your account." });
          navigate({ to: "/change-password", replace: true });
        } else {
          navigate({ to: "/mureed/dashboard", replace: true });
        }
      }}
    />
  );
}
