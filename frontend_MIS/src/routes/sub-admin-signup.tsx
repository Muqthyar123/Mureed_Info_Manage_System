import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/forms/PasswordField";
import { signupSubAdmin } from "@/services/authService";

export const Route = createFileRoute("/sub-admin-signup")({
  head: () => ({
    meta: [
      { title: "Sub Admin Registration — MIMS" },
      { name: "description", content: "Apply for a Sub Admin account on MIMS." },
    ],
  }),
  component: SubAdminSignupPage,
});

function SubAdminSignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signupSubAdmin(name, email, password);
      setSubmitted(true);
      toast.success("Application submitted successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="surface-card w-full max-w-md p-6 sm:p-8">
        <Link to="/sub-admin-login" className="mb-4 inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Sub Admin Login
        </Link>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <h2 className="text-xl font-bold">Application Received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Sub Admin signup request has been submitted. A Super Admin must review and approve your account before you can log in.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate({ to: "/sub-admin-login" })}>Return to Login</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sub Admin Registration</h1>
                <p className="text-xs text-muted-foreground">Submit your details for Super Admin review.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sub Admin Name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="subadmin@mims.app"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <PasswordField
                  id="password"
                  label=""
                  value={password}
                  onChange={(val) => setPassword(val)}
                  placeholder="Min 8 chars, A-Z, 0-9, symbol"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordField
                  id="confirmPassword"
                  label=""
                  value={confirmPassword}
                  onChange={(val) => setConfirmPassword(val)}
                  placeholder="Re-enter password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
