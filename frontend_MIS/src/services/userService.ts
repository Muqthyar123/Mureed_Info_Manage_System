import { userStore } from "@/mock/mureeds";
import type { AppUser } from "@/types";
import { apiEnabled, apiRequest, toQuery } from "@/services/apiClient";

const latency = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export async function listUsers(search?: string, role?: string, status?: string): Promise<AppUser[]> {
  if (apiEnabled) return apiRequest<AppUser[]>(`/users${toQuery({ search, role, status })}`);
  await latency();
  let rows = [...userStore];
  const term = search?.trim().toLowerCase();
  if (term) {
    rows = rows.filter(
      (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
    );
  }
  if (role && role !== "all") rows = rows.filter((u) => u.role === role);
  if (status && status !== "all") rows = rows.filter((u) => u.accountStatus === status);
  return rows;
}

export async function createMureedAccount(name: string, email: string, mureedId?: string) {
  if (apiEnabled) {
    return apiRequest<AppUser>("/users/mureed-accounts", {
      method: "POST",
      body: JSON.stringify({ name, email, mureedId }),
    });
  }
  await latency(300);
  const user: AppUser = {
    id: `usr-${email}`,
    name,
    email,
    role: "Mureed",
    accountStatus: "Pending Setup",
    createdDate: new Date().toISOString().slice(0, 10),
    mureedId,
  };
  userStore.unshift(user);
  return user;
}

export async function setAccountStatus(id: string, accountStatus: AppUser["accountStatus"]) {
  if (apiEnabled) {
    return apiRequest<AppUser | undefined>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ accountStatus }),
    });
  }
  await latency(220);
  const user = userStore.find((u) => u.id === id);
  if (user) user.accountStatus = accountStatus;
  return user;
}

export async function resendSetupEmail(id: string) {
  if (apiEnabled) return apiRequest<AppUser | undefined>(`/users/${id}/resend-setup-email`, { method: "POST" });
  await latency(300);
  return userStore.find((u) => u.id === id);
}

export async function deleteUser(id: string) {
  if (apiEnabled) {
    await apiRequest<void>(`/users/${id}`, { method: "DELETE" });
    return;
  }
  await latency(250);
  const i = userStore.findIndex((u) => u.id === id);
  if (i !== -1) userStore.splice(i, 1);
}
