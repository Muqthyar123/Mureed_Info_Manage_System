import { mureedStore } from "@/mock/mureeds";
import type { Mureed, MureedInput, MureedQuery, Paginated } from "@/types";
import { calculateAge } from "@/utils/age";
import { locationFromAddress } from "@/utils/location";
import { apiEnabled, apiRequest, toQuery } from "@/services/apiClient";

/**
 * Service layer abstraction. Today it reads from centralized mock data;
 * later each function can be swapped for a FastAPI + Supabase call
 * without touching any UI component.
 */

const latency = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Applies every active filter and sort — shared by the table and the export. */
function filterAndSort(query: MureedQuery): Mureed[] {
  const { search, peerName, gender, status, location, sortBy, sortDir } = query;

  let rows = mureedStore;
  const term = search?.trim().toLowerCase();
  if (term) {
    rows = rows.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.phone.includes(term),
    );
  }
  if (peerName && peerName !== "all") rows = rows.filter((m) => m.peerName === peerName);
  if (gender && gender !== "all") rows = rows.filter((m) => m.gender === gender);
  if (status && status !== "all") rows = rows.filter((m) => m.status === status);
  if (location && location !== "all")
    rows = rows.filter((m) => locationFromAddress(m.address) === location);

  if (sortBy) {
    const dir = sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      if (sortBy === "age") {
        return ((calculateAge(a.dateOfBirth) ?? 0) - (calculateAge(b.dateOfBirth) ?? 0)) * dir;
      }
      return String(a[sortBy]).localeCompare(String(b[sortBy])) * dir;
    });
  }
  return rows;
}

export async function listMureeds(query: MureedQuery): Promise<Paginated<Mureed>> {
  if (apiEnabled) return apiRequest<Paginated<Mureed>>(`/mureeds${toQuery(query)}`);
  await latency();
  const rows = filterAndSort(query);
  const { page, pageSize } = query;
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length, page, pageSize };
}

/** Every record matching the current filters — used by the Export button. */
export async function listMureedsForExport(query: MureedQuery): Promise<Mureed[]> {
  if (apiEnabled) return apiRequest<Mureed[]>(`/mureeds/export-data${toQuery(query)}`);
  await latency(150);
  return filterAndSort(query);
}

/** Distinct locations derived from the Address field. */
export async function listLocations(): Promise<string[]> {
  if (apiEnabled) return apiRequest<string[]>("/mureeds/locations");
  await latency(80);
  return Array.from(new Set(mureedStore.map((m) => locationFromAddress(m.address))))
    .filter(Boolean)
    .sort();
}

export async function getMureed(id: string): Promise<Mureed | undefined> {
  if (apiEnabled) {
    try {
      return await apiRequest<Mureed>(`/mureeds/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message === "Mureed not found") return undefined;
      throw error;
    }
  }
  await latency(150);
  return mureedStore.find((m) => m.id === id);
}

export async function getMureedByEmail(email: string): Promise<Mureed | undefined> {
  if (apiEnabled) {
    try {
      return await apiRequest<Mureed>(`/mureeds/by-email${toQuery({ email })}`);
    } catch (error) {
      if (error instanceof Error && error.message === "Mureed not found") return undefined;
      throw error;
    }
  }
  await latency(150);
  return mureedStore.find((m) => m.email.toLowerCase() === email.toLowerCase());
}

export async function createMureed(input: MureedInput): Promise<Mureed> {
  if (apiEnabled) {
    return apiRequest<Mureed>("/mureeds", { method: "POST", body: JSON.stringify(input) });
  }
  await latency(400);
  const next: Mureed = { ...input, id: `MRD-${String(mureedStore.length + 1).padStart(5, "0")}` };
  mureedStore.unshift(next);
  return next;
}

export async function updateMureed(id: string, input: MureedInput): Promise<Mureed> {
  if (apiEnabled) {
    return apiRequest<Mureed>(`/mureeds/${id}`, { method: "PUT", body: JSON.stringify(input) });
  }
  await latency(400);
  const index = mureedStore.findIndex((m) => m.id === id);
  if (index === -1) throw new Error("Mureed not found");
  mureedStore[index] = { ...input, id };
  return mureedStore[index];
}

export async function deleteMureed(id: string): Promise<void> {
  if (apiEnabled) {
    await apiRequest<void>(`/mureeds/${id}`, { method: "DELETE" });
    return;
  }
  await latency(300);
  const index = mureedStore.findIndex((m) => m.id === id);
  if (index !== -1) mureedStore.splice(index, 1);
}
