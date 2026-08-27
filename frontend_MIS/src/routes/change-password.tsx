import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/forms/PasswordField";
import { changePassword } from "@/services/authService";

export const Route = createFileRoute("/change-password")({
  head: () => ({
    meta: [{ title: "Change Password — MIMS" }],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Change Password" description="Update your account password for enhanced security." />
      <div className="surface-card max-w-lg p-6 sm:p-8 mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <PasswordField
              id="currentPassword"
              label=""
              value={currentPassword}
              onChange={(val) => setCurrentPassword(val)}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordField
              id="newPassword"
              label=""
              value={newPassword}
              onChange={(val) => setNewPassword(val)}
              placeholder="Min 8 chars, A-Z, 0-9, symbol"
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

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </>
  );
}
