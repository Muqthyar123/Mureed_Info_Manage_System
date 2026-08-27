import type { Mureed, MureedInput, MureedQuery, Paginated } from "@/types";
import { apiRequest, toQuery } from "@/services/apiClient";

export async function listMureeds(query: MureedQuery): Promise<Paginated<Mureed>> {
  return apiRequest<Paginated<Mureed>>(`/mureeds${toQuery(query)}`);
}

export async function listMureedsForExport(query: MureedQuery): Promise<Mureed[]> {
  return apiRequest<Mureed[]>(`/mureeds/export-data${toQuery(query)}`);
}

export async function listLocations(): Promise<string[]> {
  return apiRequest<string[]>("/mureeds/locations");
}

export async function getMureed(id: string): Promise<Mureed | undefined> {
  try {
    return await apiRequest<Mureed>(`/mureeds/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "Mureed not found") return undefined;
    throw error;
  }
}

export async function getMureedByEmail(email: string): Promise<Mureed | undefined> {
  try {
    return await apiRequest<Mureed>(`/mureeds/by-email${toQuery({ email })}`);
  } catch (error) {
    if (error instanceof Error && error.message === "Mureed not found") return undefined;
    throw error;
  }
}

export async function createMureed(input: MureedInput): Promise<Mureed> {
  return apiRequest<Mureed>("/mureeds", { method: "POST", body: JSON.stringify(input) });
}

export async function updateMureed(id: string, input: MureedInput): Promise<Mureed> {
  return apiRequest<Mureed>(`/mureeds/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteMureed(id: string): Promise<void> {
  await apiRequest<void>(`/mureeds/${id}`, { method: "DELETE" });
}

export async function resendMureedInvitation(id: string): Promise<void> {
  await apiRequest<void>(`/mureeds/${id}/resend-invitation`, { method: "POST" });
}
