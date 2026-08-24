import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoginForm } from "@/components/forms/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CREDENTIALS } from "@/services/authService";
import { DEMO_MUREED_EMAIL } from "@/mock/mureeds";

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
      hint={
        <>
          Demo credentials — Registered Email: <strong>{DEMO_MUREED_EMAIL}</strong>, Password:{" "}
          <strong>{DEMO_CREDENTIALS.mureedPassword}</strong>
        </>
      }
      onSubmit={async (email, password) => {
        await signInMureed(email, password);
        navigate({ to: "/mureed/dashboard", replace: true });
      }}
    />
  );
}
