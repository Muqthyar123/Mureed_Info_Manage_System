import type { Peer } from "@/types";
import { apiRequest, toQuery } from "@/services/apiClient";

export interface PeerRow extends Peer {
  mureedCount: number;
}

export async function listPeer(search?: string, status?: string): Promise<PeerRow[]> {
  return apiRequest<PeerRow[]>(`/peers${toQuery({ search, status })}`);
}

export async function listPeerNames(): Promise<string[]> {
  return apiRequest<string[]>("/peers/names");
}

export async function createPeer(name: string, status: Peer["status"], dateOfBirth?: string | null): Promise<Peer> {
  return apiRequest<Peer>("/peers", { method: "POST", body: JSON.stringify({ name, status, dateOfBirth: dateOfBirth || null }) });
}

export async function updatePeer(id: string, name: string, status: Peer["status"], dateOfBirth?: string | null): Promise<Peer> {
  return apiRequest<Peer>(`/peers/${id}`, { method: "PUT", body: JSON.stringify({ name, status, dateOfBirth: dateOfBirth || null }) });
}

export async function deletePeer(id: string): Promise<void> {
  await apiRequest<void>(`/peers/${id}`, { method: "DELETE" });
}
