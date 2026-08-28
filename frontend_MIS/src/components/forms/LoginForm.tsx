import { Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestPasswordReset } from "@/services/authService";
import { validateEmail } from "@/utils/validation";
import { toast } from "sonner";

export function LoginForm({
  title,
  subtitle,
  emailLabel,
  emailPlaceholder,
  hint,
  onSubmit,
  submitLabel = "Login",
  onGoogleSubmit,
  footer,
}: {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  hint?: ReactNode;
  onSubmit: (email: string, password: string) => Promise<void>;
  submitLabel?: string | undefined;
  onGoogleSubmit?: (() => Promise<void>) | undefined;
  footer?: ReactNode;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [pwError, setPwError] = useState<string | undefined>(undefined);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const eErr = validateEmail(email);
    const pErr = password ? undefined : "Password is required.";
    setEmailError(eErr);
    setPwError(pErr);
    if (eErr || pErr) return;
    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    if (!onGoogleSubmit) return;
    setError(null);
    setGoogleLoading(true);
    try {
      await onGoogleSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to login options
        </Link>

        <div className="surface-card mt-4 p-6 sm:p-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="MIMS Emblem Logo" className="h-16 w-16 object-contain rounded-md bg-white p-1 shadow-sm border border-border" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-center sm:text-left">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground text-center sm:text-left">{subtitle}</p>

          <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
            <div>
              <Label htmlFor="email" className="mb-2 block">
                {emailLabel}
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={emailPlaceholder}
                onBlur={() => setEmailError(validateEmail(email))}
              />
              {emailError && <p className="mt-1.5 text-xs text-destructive">{emailError}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {pwError && <p className="mt-1.5 text-xs text-destructive">{pwError}</p>}
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : submitLabel}
            </Button>

            {onGoogleSubmit && (
              <>
                <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  OR
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={googleLoading}
                  onClick={submitGoogle}
                >
                  <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
                    G
                  </span>
                  {googleLoading ? "Checking Google account…" : "Continue with Google"}
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="block w-full text-center text-sm text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </form>

          {footer && <div className="mt-5 border-t border-border pt-4">{footer}</div>}

          {hint && (
            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              {hint}
            </div>
          )}
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we will send a password reset link.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="forgot-email" className="mb-2 block">
              Email
            </Label>
            <Input
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={sending}
              onClick={async () => {
                setSending(true);
                try {
                  await requestPasswordReset(forgotEmail);
                  toast.success("Password reset link sent", { description: forgotEmail });
                  setForgotOpen(false);
                  setForgotEmail("");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not send reset link.");
                } finally {
                  setSending(false);
                }
              }}
            >
              {sending ? "Sending…" : "Send reset link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
