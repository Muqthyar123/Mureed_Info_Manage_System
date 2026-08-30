import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/services/authService";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot Password — MIMS" }],
  }),
  component: ForgotPasswordPage,
});

import { playNotificationSound } from "@/utils/sound";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      playNotificationSound();
      toast.success("Password reset instructions sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="surface-card w-full max-w-md p-6 sm:p-8">
        <Link to="/login" className="mb-4 inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Login
        </Link>

        {sent ? (
          <div className="text-center py-6">
            <Mail className="mx-auto h-12 w-12 text-primary mb-3" />
            <h2 className="text-xl font-bold">Check Your Email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, a password reset link has been dispatched via Brevo.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Forgot Password</h1>
                <p className="text-xs text-muted-foreground">Enter your email to receive a password reset link.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Registered Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending link..." : "Send Reset Email"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
