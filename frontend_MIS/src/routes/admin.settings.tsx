import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { PasswordField } from "@/components/forms/PasswordField";
import { validatePassword } from "@/utils/validation";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Mureed Information Management System" },
      { name: "description", content: "Admin profile, account, security and application preferences." },
      { property: "og:title", content: "Settings — MIMS" },
      { property: "og:description", content: "Manage admin profile and system preferences." },
    ],
  }),
  component: SettingsPage,
});

const MODULES = [
  "Mureed Management",
  "Peer Management",
  "Reports",
  "User Management",
  "Settings",
];

function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | undefined>(undefined);
  const [compactTables, setCompactTables] = useState(false);
  const [emailNotices, setEmailNotices] = useState(true);
  const [enabled, setEnabled] = useState<string[]>(MODULES);

  const toggleModule = (m: string) =>
    setEnabled((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <>
      <PageHeader title="Settings" description="System settings for the Admin account." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="surface-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Admin profile</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="admin-name" className="mb-2 block">
                Name
              </Label>
              <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="admin-email" className="mb-2 block">
                Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button onClick={() => toast.success("Profile settings saved")}>Save profile</Button>
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Security</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="cur-pw" className="mb-2 block">
                Current Password
              </Label>
              <Input
                id="cur-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <PasswordField
              id="new-pw"
              label="New Password"
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v);
                if (pwError) setPwError(validatePassword(v));
              }}
              onBlur={() => setPwError(validatePassword(newPassword))}
              error={pwError}
            />
            <Button
              onClick={() => {
                const invalid = validatePassword(newPassword);
                setPwError(invalid);
                if (invalid) return;
                setCurrentPassword("");
                setNewPassword("");
                setPwError(undefined);
                toast.success("Password updated");
              }}
            >
              Update password
            </Button>
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Application preferences</h2>
          <div className="mt-4 space-y-4">
            <PrefRow
              label="Compact tables"
              description="Reduce row spacing in data tables."
              checked={compactTables}
              onChange={setCompactTables}
            />
            <PrefRow
              label="Account email notifications"
              description="Send account setup and status emails to Mureeds."
              checked={emailNotices}
              onChange={setEmailNotices}
            />
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">System Modules</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enable or disable optional modules. Core architecture cannot be deleted.
          </p>
          <div className="mt-4 space-y-3">
            {MODULES.map((m) => (
              <label key={m} className="flex items-center gap-3 text-sm">
                <Checkbox checked={enabled.includes(m)} onCheckedChange={() => toggleModule(m)} />
                {m}
              </label>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function PrefRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
