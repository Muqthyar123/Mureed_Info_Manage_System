import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/forms/PasswordField";
import { resetPassword } from "@/services/authService";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset Password — MIMS" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search?.token || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="surface-card w-full max-w-md p-6 sm:p-8">
        {success ? (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <h2 className="text-xl font-bold">Password Reset Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been updated successfully. You can now log in with your new credentials.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => navigate({ to: "/login" })}>Proceed to Login</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Set New Password</h1>
                <p className="text-xs text-muted-foreground">Enter your new secure account password.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordField
                  id="newPassword"
                  label=""
                  value={newPassword}
                  onChange={(val) => setNewPassword(val)}
                  placeholder="Min 8 chars, uppercase, number, symbol"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordField
                  id="confirmPassword"
                  label=""
                  value={confirmPassword}
                  onChange={(val) => setConfirmPassword(val)}
                  placeholder="Re-enter new password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating password..." : "Update Password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
