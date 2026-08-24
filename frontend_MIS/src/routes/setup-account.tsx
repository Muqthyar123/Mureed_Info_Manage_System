import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/forms/PasswordField";
import { completeAccountSetup } from "@/services/authService";
import { validatePassword } from "@/utils/validation";

const searchSchema = z.object({ email: z.string().optional() });

export const Route = createFileRoute("/setup-account")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Set Up Your Account — Mureed Information Management System" },
      {
        name: "description",
        content: "Create your password to activate your Mureed account and sign in.",
      },
      { property: "og:title", content: "Set Up Your Account — MIMS" },
      { property: "og:description", content: "Activate your Mureed account by creating a password." },
    ],
  }),
  component: SetupAccountPage,
});

function SetupAccountPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const invalid = validatePassword(password);
    setPwError(invalid);
    if (invalid) return;
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await completeAccountSetup(email ?? "mureed@example.com", password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="surface-card w-full max-w-md p-6 sm:p-8">
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-10 text-success" />
            <h1 className="mt-4 text-xl font-semibold">Account activated</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been created. You can now log in with your registered email.
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate({ to: "/mureed-login" })}>
              Go to Mureed Login
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Create your password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Setting up the account for{" "}
              <strong className="text-foreground">{email ?? "your registered email"}</strong>.
            </p>
            <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
              <PasswordField
                id="pw"
                label="New Password"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  if (pwError) setPwError(validatePassword(v));
                }}
                onBlur={() => setPwError(validatePassword(password))}
                error={pwError}
              />
              <div>
                <Label htmlFor="pw2" className="mb-2 block">
                  Confirm Password
                </Label>
                <Input
                  id="pw2"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Activating…" : "Activate account"}
              </Button>
            </form>
            <Link
              to="/"
              className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to login options
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
