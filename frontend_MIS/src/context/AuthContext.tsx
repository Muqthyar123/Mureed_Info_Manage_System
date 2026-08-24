import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loginAdmin,
  loginAdminWithGoogle,
  loginMureed,
  persistUser,
  readPersistedUser,
  startAdminSignup,
  verifyAdminSignupOtp,
} from "@/services/authService";
import type { AuthUser, PendingAdminSignup } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signInAdmin: (email: string, password: string) => Promise<AuthUser>;
  signInAdminWithGoogle: (email: string) => Promise<AuthUser>;
  startAdminSignup: (name: string, email: string, password: string) => Promise<PendingAdminSignup>;
  verifyAdminSignupOtp: (
    signup: PendingAdminSignup,
    otp: string,
  ) => Promise<
    { status: "ACTIVE"; user: AuthUser } | { status: "PENDING" } | { status: "REJECTED" }
  >;
  signInMureed: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readPersistedUser());
    setReady(true);
  }, []);

  const signInAdmin = useCallback(async (email: string, password: string) => {
    const next = await loginAdmin(email, password);
    persistUser(next);
    setUser(next);
    return next;
  }, []);

  const signInAdminWithGoogle = useCallback(async (email: string) => {
    const next = await loginAdminWithGoogle(email);
    persistUser(next);
    setUser(next);
    return next;
  }, []);

  const beginAdminSignup = useCallback(
    (name: string, email: string, password: string) => startAdminSignup(name, email, password),
    [],
  );

  const completeAdminSignupOtp = useCallback(async (signup: PendingAdminSignup, otp: string) => {
    const result = await verifyAdminSignupOtp(signup, otp);
    if (result.status === "ACTIVE") {
      persistUser(result.user);
      setUser(result.user);
    }
    return result;
  }, []);

  const signInMureed = useCallback(async (email: string, password: string) => {
    const next = await loginMureed(email, password);
    persistUser(next);
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    persistUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      signInAdmin,
      signInAdminWithGoogle,
      startAdminSignup: beginAdminSignup,
      verifyAdminSignupOtp: completeAdminSignupOtp,
      signInMureed,
      signOut,
    }),
    [
      user,
      ready,
      signInAdmin,
      signInAdminWithGoogle,
      beginAdminSignup,
      completeAdminSignupOtp,
      signInMureed,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
