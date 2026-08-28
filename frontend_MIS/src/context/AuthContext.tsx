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
  getMe,
  loginAdmin,
  loginSubAdmin,
  loginAdminWithGoogle,
  loginMureed,
  persistUser,
  readPersistedUser,
  startAdminSignup,
  verifyAdminSignupOtp,
} from "@/services/authService";
import { apiEnabled, persistToken, readToken } from "@/services/apiClient";
import type { AuthUser, PendingAdminSignup } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signInAdmin: (email: string, password: string) => Promise<AuthUser>;
  signInSubAdmin: (email: string, password: string) => Promise<AuthUser>;
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
    async function initAuth() {
      if (apiEnabled) {
        const token = readToken();
        if (token) {
          try {
            const currentUser = await getMe();
            if (currentUser) {
              persistUser(currentUser);
              setUser(currentUser);
            } else {
              persistToken(null);
              persistUser(null);
              setUser(null);
            }
          } catch {
            persistToken(null);
            persistUser(null);
            setUser(null);
          }
        } else {
          persistUser(null);
          setUser(null);
        }
      } else {
        setUser(readPersistedUser());
      }
      setReady(true);
    }
    initAuth();
  }, []);


  const signInAdmin = useCallback(async (email: string, password: string) => {
    const next = await loginAdmin(email, password);
    persistUser(next);
    setUser(next);
    return next;
  }, []);

  const signInSubAdmin = useCallback(async (email: string, password: string) => {
    const next = await loginSubAdmin(email, password);
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
    persistToken(null);
    persistUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      signInAdmin,
      signInSubAdmin,
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
      signInSubAdmin,
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
