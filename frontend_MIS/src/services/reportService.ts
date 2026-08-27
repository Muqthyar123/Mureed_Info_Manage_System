import { apiRequest } from "@/services/apiClient";

export interface OverviewStats {
  totalMureeds: number;
  availableMureeds: number;
  passedOutMureeds: number;
  totalPeer: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  return apiRequest<OverviewStats>("/reports/overview");
}

export interface PeerBreakdown {
  peerName: string;
  total: number;
  available: number;
  passedOut: number;
}

export async function getMureedsByPeer(): Promise<PeerBreakdown[]> {
  return apiRequest<PeerBreakdown[]>("/reports/mureeds-by-peer");
}
