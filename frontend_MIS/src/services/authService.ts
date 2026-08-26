import { getMureedByEmail } from "@/services/mureedService";
import {
  MAIN_ADMIN_EMAIL,
  MOCK_ADMIN_APPROVAL_REQUESTS,
  MOCK_ADMIN_USERS,
  MOCK_OTP,
  MOCK_OTP_TTL_MS,
} from "@/mock/adminConfig";
import type {
  AdminApprovalRequest,
  AdminAuthMethod,
  AuthUser,
  MockAdminUser,
  PendingAdminSignup,
} from "@/types";
import { apiEnabled, apiRequest, persistToken } from "@/services/apiClient";

/**
 * Centralized mock authentication. Replace the bodies of these functions with
 * real FastAPI calls later — the rest of the app only talks to this module.
 */

const ADMIN_EMAIL = "admin@mims.app";
const ADMIN_PASSWORD = "admin123";
const MAIN_ADMIN_DEMO_PASSWORD = "Admin@123";
const MUREED_PASSWORD = "mureed123";
const STORAGE_KEY = "mims.auth.user";
const ADMIN_USERS_KEY = "mims.mock.adminUsers";
const ADMIN_REQUESTS_KEY = "mims.mock.adminApprovalRequests";

const latency = (ms = 500) => new Promise((r) => setTimeout(r, ms));

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function hashMockPassword(password: string) {
  const input = new TextEncoder().encode(`mims-mock:${password}`);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", input);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return btoa(`mims-mock:${password}`);
}

async function seededAdminUsers(): Promise<MockAdminUser[]> {
  const seeded = await Promise.all(
    MOCK_ADMIN_USERS.map(async (admin) => ({
      ...admin,
      passwordHash:
        admin.email === MAIN_ADMIN_EMAIL || admin.email === ADMIN_EMAIL
          ? await hashMockPassword(
              admin.email === MAIN_ADMIN_EMAIL ? MAIN_ADMIN_DEMO_PASSWORD : ADMIN_PASSWORD,
            )
          : admin.passwordHash,
    })),
  );
  return seeded;
}

async function readAdminUsers(): Promise<MockAdminUser[]> {
  if (typeof window === "undefined") return seededAdminUsers();
  try {
    const raw = window.localStorage.getItem(ADMIN_USERS_KEY);
    if (raw) return JSON.parse(raw) as MockAdminUser[];
  } catch {
    // Fall through to seed data.
  }
  const seeded = await seededAdminUsers();
  writeAdminUsers(seeded);
  return seeded;
}

function writeAdminUsers(users: MockAdminUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
}

function readApprovalRequests(): AdminApprovalRequest[] {
  if (typeof window === "undefined") return MOCK_ADMIN_APPROVAL_REQUESTS;
  try {
    const raw = window.localStorage.getItem(ADMIN_REQUESTS_KEY);
    if (raw) return JSON.parse(raw) as AdminApprovalRequest[];
  } catch {
    // Fall through to seed data.
  }
  writeApprovalRequests(MOCK_ADMIN_APPROVAL_REQUESTS);
  return MOCK_ADMIN_APPROVAL_REQUESTS;
}

function writeApprovalRequests(requests: AdminApprovalRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_REQUESTS_KEY, JSON.stringify(requests));
}

function toAuthUser(admin: MockAdminUser): AuthUser {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: "Admin",
    adminRole: admin.role,
  };
}

function upsertApprovalRequest(
  requests: AdminApprovalRequest[],
  admin: Pick<MockAdminUser, "name" | "email">,
  authMethod: AdminAuthMethod,
) {
  const email = normalizeEmail(admin.email);
  const existing = requests.find((r) => normalizeEmail(r.email) === email);
  if (existing) {
    existing.name = admin.name;
    existing.authMethod = authMethod;
    if (existing.status !== "REJECTED") existing.status = "PENDING";
    return requests;
  }
  return [
    ...requests,
    {
      id: `admin-req-${Date.now()}`,
      name: admin.name,
      email,
      status: "PENDING",
      authMethod,
      requestedDate: today(),
    },
  ];
}

export async function loginAdmin(email: string, password: string): Promise<AuthUser> {
  if (apiEnabled) {
    const result = await apiRequest<{ user: AuthUser; accessToken: string }>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    persistToken(result.accessToken);
    return result.user;
  }
  await latency();
  const normalized = normalizeEmail(email);
  const users = await readAdminUsers();
  const admin = users.find((u) => normalizeEmail(u.email) === normalized);

  if (!admin || !admin.authMethods.includes("password")) {
    throw new Error("Invalid admin email or password.");
  }
  if (admin.status === "PENDING") {
    throw new Error("Your Admin account is waiting for Main Admin approval.");
  }
  if (admin.status === "REJECTED") {
    throw new Error("Your Admin access request has been rejected.");
  }
  if (!admin.passwordHash || admin.passwordHash !== (await hashMockPassword(password))) {
    throw new Error("Invalid admin email or password.");
  }
  return toAuthUser(admin);
}

export async function loginMureed(email: string, password: string): Promise<AuthUser> {
  if (apiEnabled) {
    const result = await apiRequest<{ user: AuthUser; accessToken: string }>("/auth/mureed/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    persistToken(result.accessToken);
    return result.user;
  }
  await latency();
  const mureed = await getMureedByEmail(email.trim());
  if (!mureed || password !== MUREED_PASSWORD) {
    throw new Error("Invalid registered email or password.");
  }
  return {
    id: `usr-${mureed.id}`,
    name: mureed.name,
    email: mureed.email,
    role: "Mureed",
    mureedId: mureed.id,
  };
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (apiEnabled) {
    await apiRequest<void>("/auth/password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return;
  }
  await latency(400);
  if (!email.trim()) throw new Error("Please enter your email address.");
}

export async function completeAccountSetup(email: string, password: string): Promise<void> {
  if (apiEnabled) {
    await apiRequest<void>("/auth/mureed/setup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return;
  }
  await latency(500);
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (!email) throw new Error("Setup link is invalid.");
}

export async function startAdminSignup(
  name: string,
  email: string,
  password: string,
): Promise<PendingAdminSignup> {
  if (apiEnabled) {
    return apiRequest<PendingAdminSignup>("/auth/admin/signup/start", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }
  await latency(400);
  return {
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash: await hashMockPassword(password),
    expiresAt: Date.now() + MOCK_OTP_TTL_MS,
  };
}

export async function verifyAdminSignupOtp(
  signup: PendingAdminSignup,
  otp: string,
): Promise<{ status: "ACTIVE"; user: AuthUser } | { status: "PENDING" } | { status: "REJECTED" }> {
  if (apiEnabled) {
    const result = await apiRequest<
      { status: "ACTIVE"; user: AuthUser; accessToken: string } | { status: "PENDING" } | { status: "REJECTED" }
    >("/auth/admin/signup/verify", {
      method: "POST",
      body: JSON.stringify({ signup, otp }),
    });
    if (result.status === "ACTIVE") persistToken(result.accessToken);
    return result;
  }
  await latency(400);
  if (Date.now() > signup.expiresAt) throw new Error("OTP has expired. Please request a new OTP.");
  if (otp !== MOCK_OTP) throw new Error("Invalid OTP. Please try again.");

  const users = await readAdminUsers();
  const requests = readApprovalRequests();
  const existing = users.find((u) => normalizeEmail(u.email) === signup.email);

  if (existing?.status === "ACTIVE") return { status: "ACTIVE", user: toAuthUser(existing) };
  if (existing?.status === "REJECTED") return { status: "REJECTED" };

  const isMainAdmin = signup.email === MAIN_ADMIN_EMAIL;
  const admin: MockAdminUser = {
    id: existing?.id ?? `usr-admin-${Date.now()}`,
    name: signup.name,
    email: signup.email,
    role: isMainAdmin ? "MAIN_ADMIN" : "ADMIN",
    status: isMainAdmin ? "ACTIVE" : "PENDING",
    authMethods: ["password"],
    passwordHash: signup.passwordHash,
    createdDate: existing?.createdDate ?? today(),
  };

  writeAdminUsers([...users.filter((u) => normalizeEmail(u.email) !== signup.email), admin]);

  if (admin.status === "PENDING") {
    writeApprovalRequests(upsertApprovalRequest(requests, admin, "password"));
    return { status: "PENDING" };
  }

  return { status: "ACTIVE", user: toAuthUser(admin) };
}

export async function resendAdminSignupOtp(
  signup: PendingAdminSignup,
): Promise<PendingAdminSignup> {
  if (apiEnabled) {
    return apiRequest<PendingAdminSignup>("/auth/admin/signup/resend", {
      method: "POST",
      body: JSON.stringify(signup),
    });
  }
  await latency(300);
  return { ...signup, expiresAt: Date.now() + MOCK_OTP_TTL_MS };
}

export async function loginAdminWithGoogle(email: string): Promise<AuthUser> {
  if (apiEnabled) {
    const result = await apiRequest<{ user: AuthUser; accessToken: string }>("/auth/admin/google", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    persistToken(result.accessToken);
    return result.user;
  }
  await latency(500);
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("Please enter a mock Google email.");

  const users = await readAdminUsers();
  const requests = readApprovalRequests();
  const existing = users.find((u) => normalizeEmail(u.email) === normalized);

  if (existing?.status === "ACTIVE") {
    if (!existing.authMethods.includes("google")) {
      existing.authMethods = [...existing.authMethods, "google"];
      writeAdminUsers(users);
    }
    return toAuthUser(existing);
  }
  if (existing?.status === "REJECTED")
    throw new Error("Your Admin access request has been rejected.");
  if (existing?.status === "PENDING") {
    throw new Error("Your Admin account is waiting for Main Admin approval.");
  }

  const isMainAdmin = normalized === MAIN_ADMIN_EMAIL;
  const admin: MockAdminUser = {
    id: `usr-admin-google-${Date.now()}`,
    name: isMainAdmin ? "Main Admin" : normalized.split("@")[0],
    email: normalized,
    role: isMainAdmin ? "MAIN_ADMIN" : "ADMIN",
    status: isMainAdmin ? "ACTIVE" : "PENDING",
    authMethods: ["google"],
    createdDate: today(),
  };

  writeAdminUsers([...users, admin]);
  if (admin.status === "PENDING") {
    writeApprovalRequests(upsertApprovalRequest(requests, admin, "google"));
    throw new Error(
      "This Google account is not authorized for Admin access. Your request has been sent for approval.",
    );
  }

  return toAuthUser(admin);
}

export async function listAdminApprovalRequests(): Promise<AdminApprovalRequest[]> {
  if (apiEnabled) return apiRequest<AdminApprovalRequest[]>("/auth/admin/approval-requests");
  await latency(250);
  return readApprovalRequests();
}

export async function approveAdminRequest(requestId: string): Promise<void> {
  if (apiEnabled) {
    await apiRequest<void>(`/auth/admin/approval-requests/${requestId}/approve`, { method: "POST" });
    return;
  }
  await latency(300);
  const requests = readApprovalRequests();
  const request = requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Admin approval request was not found.");

  const users = await readAdminUsers();
  const existing = users.find((u) => normalizeEmail(u.email) === normalizeEmail(request.email));
  const activeAdmin: MockAdminUser = {
    id: existing?.id ?? `usr-admin-${Date.now()}`,
    name: existing?.name ?? request.name,
    email: normalizeEmail(request.email),
    role: "ADMIN",
    status: "ACTIVE",
    authMethods: existing?.authMethods?.length ? existing.authMethods : [request.authMethod],
    passwordHash: existing?.passwordHash,
    createdDate: existing?.createdDate ?? today(),
  };

  writeAdminUsers([
    ...users.filter((u) => normalizeEmail(u.email) !== activeAdmin.email),
    activeAdmin,
  ]);
  writeApprovalRequests(
    requests.map((r) => (r.id === requestId ? { ...r, status: "APPROVED" } : r)),
  );
}

export async function rejectAdminRequest(requestId: string): Promise<void> {
  if (apiEnabled) {
    await apiRequest<void>(`/auth/admin/approval-requests/${requestId}/reject`, { method: "POST" });
    return;
  }
  await latency(300);
  const requests = readApprovalRequests();
  const request = requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Admin approval request was not found.");

  const users = await readAdminUsers();
  writeAdminUsers(
    users.map((u) =>
      normalizeEmail(u.email) === normalizeEmail(request.email) ? { ...u, status: "REJECTED" } : u,
    ),
  );
  writeApprovalRequests(
    requests.map((r) => (r.id === requestId ? { ...r, status: "REJECTED" } : r)),
  );
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

export const DEMO_CREDENTIALS = {
  adminEmail: ADMIN_EMAIL,
  adminPassword: ADMIN_PASSWORD,
  mainAdminEmail: MAIN_ADMIN_EMAIL,
  mainAdminPassword: MAIN_ADMIN_DEMO_PASSWORD,
  mockOtp: MOCK_OTP,
  mureedPassword: MUREED_PASSWORD,
};
