import type {
  AdminApprovalRequest,
  AuthUser,
  PendingAdminSignup,
} from "@/types";
import { apiRequest, persistToken } from "@/services/apiClient";

export const MAIN_ADMIN_EMAIL = "aasthanakhadariyaaskariya.admin@gmail.com";
const STORAGE_KEY = "mims.auth.user";

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export async function loginAdmin(email: string, password: string): Promise<AuthUser> {
  const result = await apiRequest<AuthResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  persistToken(result.accessToken);
  persistUser(result.user);
  return result.user;
}

export async function loginSubAdmin(email: string, password: string): Promise<AuthUser> {
  const result = await apiRequest<AuthResponse>("/auth/sub-admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  persistToken(result.accessToken);
  persistUser(result.user);
  return result.user;
}

export async function signupSubAdmin(
  name: string,
  email: string,
  password: string,
): Promise<{ status: "PENDING"; message: string }> {
  return await apiRequest<{ status: "PENDING"; message: string }>("/auth/sub-admin/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginMureed(email: string, password: string): Promise<AuthUser> {
  const result = await apiRequest<AuthResponse>("/auth/mureed/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  persistToken(result.accessToken);
  persistUser(result.user);
  return result.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function completeAccountSetup(email: string, password: string): Promise<void> {
  await apiRequest<void>("/auth/mureed/setup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function startAdminSignup(
  name: string,
  email: string,
  password: string,
): Promise<PendingAdminSignup> {
  return apiRequest<PendingAdminSignup>("/auth/admin/signup/start", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function verifyAdminSignupOtp(
  signup: PendingAdminSignup,
  otp: string,
): Promise<{ status: "ACTIVE"; user: AuthUser } | { status: "PENDING" } | { status: "REJECTED" }> {
  const result = await apiRequest<
    { status: "ACTIVE"; user: AuthUser; accessToken: string } | { status: "PENDING" } | { status: "REJECTED" }
  >("/auth/admin/signup/verify", {
    method: "POST",
    body: JSON.stringify({ signup, otp }),
  });
  if (result.status === "ACTIVE") {
    persistToken(result.accessToken);
    persistUser(result.user);
  }
  return result;
}

export async function resendAdminSignupOtp(
  signup: PendingAdminSignup,
): Promise<PendingAdminSignup> {
  return apiRequest<PendingAdminSignup>("/auth/admin/signup/resend", {
    method: "POST",
    body: JSON.stringify(signup),
  });
}

export async function loginAdminWithGoogle(email: string): Promise<AuthUser> {
  const result = await apiRequest<AuthResponse>("/auth/admin/google", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  persistToken(result.accessToken);
  persistUser(result.user);
  return result.user;
}

export async function listAdminApprovalRequests(): Promise<AdminApprovalRequest[]> {
  return apiRequest<AdminApprovalRequest[]>("/auth/admin/approval-requests");
}

export async function approveAdminRequest(requestId: string): Promise<void> {
  await apiRequest<void>(`/auth/admin/approval-requests/${requestId}/approve`, { method: "POST" });
}

export async function rejectAdminRequest(requestId: string): Promise<void> {
  await apiRequest<void>(`/auth/admin/approval-requests/${requestId}/reject`, { method: "POST" });
}

export function persistUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else {
    window.localStorage.removeItem(STORAGE_KEY);
    persistToken(null);
  }
}

export function readPersistedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const user = await apiRequest<AuthUser>("/auth/me");
    if (user) {
      persistUser(user);
      return user;
    }
    persistUser(null);
    return null;
  } catch {
    persistUser(null);
    return null;
  }
}

export const DEMO_CREDENTIALS = {
  adminEmail: "admin@mims.app",
  adminPassword: "Admin@123",
  mainAdminEmail: MAIN_ADMIN_EMAIL,
  mainAdminPassword: "@Saifulla_123",
  mockOtp: "123456",
  mureedPassword: "@Mureed_123",
};
