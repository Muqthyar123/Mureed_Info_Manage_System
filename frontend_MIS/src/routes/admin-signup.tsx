import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PasswordField } from "@/components/forms/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CREDENTIALS, resendAdminSignupOtp } from "@/services/authService";
import type { PendingAdminSignup } from "@/types";
import { validateEmail, validateName, validatePassword } from "@/utils/validation";

export const Route = createFileRoute("/admin-signup")({
  head: () => ({
    meta: [
      { title: "Admin Sign Up - Mureed Information Management System" },
      { name: "description", content: "Create a mock Admin account and verify it with OTP." },
      { property: "og:title", content: "Admin Sign Up - MIMS" },
      { property: "og:description", content: "Frontend-only Admin registration prototype." },
    ],
  }),
  component: AdminSignupPage,
});

type FieldErrors = {
  name?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
  confirmPassword?: string | undefined;
};

function AdminSignupPage() {
  const navigate = useNavigate();
  const { startAdminSignup, verifyAdminSignupOtp } = useAuth();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [signup, setSignup] = useState<PendingAdminSignup | null>(null);
  const [result, setResult] = useState<"PENDING" | "REJECTED" | null>(null);

  const validate = () => {
    const next: FieldErrors = {
      name: validateName(name)?.replace("Mureed Name", "Name"),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: confirmPassword
        ? password === confirmPassword
          ? undefined
          : "Passwords do not match."
        : "Re-enter Password is required.",
    };
    setErrors(next);
    const first = Object.entries(next).find(([, value]) => value);
    if (first?.[0] === "name") nameRef.current?.focus();
    if (first?.[0] === "email") emailRef.current?.focus();
    if (first?.[0] === "password") document.getElementById("admin-password")?.focus();
    if (first?.[0] === "confirmPassword")
      document.getElementById("admin-confirm-password")?.focus();
    return !first;
  };

  const submitSignup = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) {
      setFormError("Please correct the highlighted fields.");
      return;
    }
    setLoading(true);
    try {
      const next = await startAdminSignup(name, email, password);
      setSignup(next);
      setOtp("");
      toast.success("Mock OTP sent", { description: `Use ${DEMO_CREDENTIALS.mockOtp}` });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not start Admin signup.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!signup) return;
    setFormError(null);
    setOtpLoading(true);
    try {
      const verification = await verifyAdminSignupOtp(signup, otp);
      if (verification.status === "ACTIVE") {
        toast.success("Admin account verified");
        navigate({ to: "/admin/dashboard", replace: true });
      } else {
        setResult(verification.status);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!signup) return;
    const next = await resendAdminSignupOtp(signup);
    setSignup(next);
    setOtp("");
    setFormError(null);
    toast.success("Mock OTP resent", { description: `Use ${DEMO_CREDENTIALS.mockOtp}` });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          to="/admin-login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Admin Login
        </Link>

        <div className="surface-card mt-4 p-6 sm:p-8">
          {!signup && !result && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Admin Sign Up</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Create an Admin registration request. New Admins require Main Admin approval.
              </p>

              <form className="mt-6 space-y-4" onSubmit={submitSignup} noValidate>
                <div>
                  <Label htmlFor="admin-name" className="mb-2 block">
                    Name
                  </Label>
                  <Input
                    ref={nameRef}
                    id="admin-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onBlur={() =>
                      setErrors((e) => ({
                        ...e,
                        name: validateName(name)?.replace("Mureed Name", "Name"),
                      }))
                    }
                    autoComplete="name"
                    placeholder="Enter name"
                  />
                  {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="admin-email" className="mb-2 block">
                    Email
                  </Label>
                  <Input
                    ref={emailRef}
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setErrors((e) => ({ ...e, email: validateEmail(email) }))}
                    autoComplete="email"
                    placeholder="example123@gmail.com"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div>
                  <PasswordField
                    id="admin-password"
                    label="Enter Password"
                    value={password}
                    onChange={setPassword}
                    onBlur={() =>
                      setErrors((e) => ({ ...e, password: validatePassword(password) }))
                    }
                    error={errors.password}
                    placeholder="Create password"
                  />
                </div>

                <div>
                  <PasswordField
                    id="admin-confirm-password"
                    label="Re-enter Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    onBlur={() =>
                      setErrors((e) => ({
                        ...e,
                        confirmPassword:
                          confirmPassword && password === confirmPassword
                            ? undefined
                            : "Passwords do not match.",
                      }))
                    }
                    error={errors.confirmPassword}
                    showRequirements={false}
                    placeholder="Confirm password"
                  />
                </div>

                {formError && (
                  <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending OTP..." : "Continue to OTP Verification"}
                </Button>
              </form>
            </>
          )}

          {signup && !result && (
            <>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-accent p-2 text-accent-foreground">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Verify Your Email</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We sent a verification code to <strong>{signup.email}</strong>.
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={verifyOtp}>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {formError && (
                  <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={otpLoading || otp.length !== 6}>
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                  <Button type="button" variant="ghost" size="sm" onClick={resendOtp}>
                    <RefreshCw className="size-4" />
                    Resend OTP
                  </Button>
                </div>
              </form>
            </>
          )}

          {result === "PENDING" && (
            <StatusMessage
              icon={Clock}
              title="Your Admin registration has been submitted."
              body="Your account is waiting for approval from the Main Admin. You will receive access after approval."
            />
          )}

          {result === "REJECTED" && (
            <StatusMessage
              icon={Clock}
              title="Your Admin access request has been rejected."
              body="Please contact the Main Admin if you believe this status should be reviewed."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatusMessage({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof CheckCircle2;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-6" />
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-6">
        <Link to="/admin-login">Back to Admin Login</Link>
      </Button>
    </div>
  );
}
