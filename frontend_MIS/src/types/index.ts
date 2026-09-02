export type Gender = "Male" | "Female";

export type MureedStatus = "Available" | "Passed Out";

export interface Mureed {
  id: string;
  name: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: Gender;
  address: string;
  phone: string;
  email: string;
  peerName: string;
  status: MureedStatus;
  message?: string | null;
  emailSent?: boolean | null;
}

export type MureedInput = Omit<Mureed, "id" | "message" | "emailSent">;

export interface Peer {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

export type UserRole = "SUPER_ADMIN" | "SUB_ADMIN" | "MUREED" | "Admin" | "Mureed";

export type AccountStatus = "Active" | "Inactive" | "Pending Setup" | "PASSWORD_CHANGE_REQUIRED";

export type AdminInternalRole = "SUPER_ADMIN" | "SUB_ADMIN" | "MAIN_ADMIN" | "ADMIN";
export type AdminAccessStatus = "ACTIVE" | "PENDING" | "REJECTED";
export type AdminAuthMethod = "password" | "google";


export interface MockAdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminInternalRole;
  status: AdminAccessStatus;
  authMethods: AdminAuthMethod[];
  createdDate: string;
  passwordHash?: string | undefined;
}

export interface AdminApprovalRequest {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  authMethod: AdminAuthMethod;
  requestedDate: string;
}

export interface PendingAdminSignup {
  name: string;
  email: string;
  passwordHash: string;
  expiresAt: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdDate: string;
  mureedId?: string | undefined;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  adminRole?: AdminInternalRole | undefined;
  mureedId?: string | undefined;
}

export interface MureedQuery {
  page: number;
  pageSize: number;
  search?: string;
  peerName?: string;
  location?: string;
  gender?: string;
  status?: string;
  sortBy?: keyof Mureed | "age";
  sortDir?: "asc" | "desc";
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}
