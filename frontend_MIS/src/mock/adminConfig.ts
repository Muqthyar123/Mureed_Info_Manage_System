import type { AdminApprovalRequest, MockAdminUser } from "@/types";

/**
 * Development-only admin authentication configuration.
 * Replace these values and mock records with FastAPI/Supabase-backed data later.
 */
export const MAIN_ADMIN_EMAIL = "mainadmin@example.com";
export const MOCK_OTP = "123456";
export const MOCK_OTP_TTL_MS = 10 * 60 * 1000;

export const MOCK_ADMIN_USERS: MockAdminUser[] = [
  {
    id: "usr-main-admin",
    name: "Main Admin",
    email: MAIN_ADMIN_EMAIL,
    role: "MAIN_ADMIN",
    status: "ACTIVE",
    authMethods: ["password", "google"],
    createdDate: "2026-01-01",
  },
  {
    id: "usr-admin",
    name: "System Admin",
    email: "admin@mims.app",
    role: "ADMIN",
    status: "ACTIVE",
    authMethods: ["password"],
    createdDate: "2026-01-02",
  },
];

export const MOCK_ADMIN_APPROVAL_REQUESTS: AdminApprovalRequest[] = [
  {
    id: "admin-req-john",
    name: "John Doe",
    email: "john@example.com",
    status: "PENDING",
    authMethod: "password",
    requestedDate: "2026-01-05",
  },
];
