import { userStore } from "@/mock/mureeds";
import type { AppUser } from "@/types";

const latency = (ms = 220) => new Promise((r) => setTimeout(r, ms));

export async function listUsers(search?: string, role?: string, status?: string): Promise<AppUser[]> {
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
  await latency(220);
  const user = userStore.find((u) => u.id === id);
  if (user) user.accountStatus = accountStatus;
  return user;
}

export async function resendSetupEmail(id: string) {
  await latency(300);
  return userStore.find((u) => u.id === id);
}

export async function deleteUser(id: string) {
  await latency(250);
  const i = userStore.findIndex((u) => u.id === id);
  if (i !== -1) userStore.splice(i, 1);
}
