import type { AppUser } from "@/types";
import { apiRequest, toQuery } from "@/services/apiClient";

export async function listUsers(search?: string, role?: string, status?: string): Promise<AppUser[]> {
  return apiRequest<AppUser[]>(`/users${toQuery({ search, role, status })}`);
}

export async function createMureedAccount(name: string, email: string, mureedId?: string): Promise<AppUser> {
  return apiRequest<AppUser>("/users/mureed-accounts", {
    method: "POST",
    body: JSON.stringify({ name, email, mureedId }),
  });
}

export async function setAccountStatus(
  id: string,
  accountStatus: AppUser["accountStatus"],
): Promise<AppUser | undefined> {
  return apiRequest<AppUser | undefined>(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ accountStatus }),
  });
}

export async function resendSetupEmail(id: string): Promise<AppUser | undefined> {
  return apiRequest<AppUser | undefined>(`/users/${id}/resend-setup-email`, { method: "POST" });
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest<void>(`/users/${id}`, { method: "DELETE" });
}
