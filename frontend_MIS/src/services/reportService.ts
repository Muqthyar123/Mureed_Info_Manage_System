import { PEERS, mureedStore } from "@/mock/mureeds";

const latency = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export interface OverviewStats {
  totalMureeds: number;
  availableMureeds: number;
  passedOutMureeds: number;
  totalPeer: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  await latency();
  return {
    totalMureeds: mureedStore.length,
    availableMureeds: mureedStore.filter((m) => m.status === "Available").length,
    passedOutMureeds: mureedStore.filter((m) => m.status === "Passed Out").length,
    totalPeer: PEERS.length,
  };
}

export interface PeerBreakdown {
  peerName: string;
  total: number;
  available: number;
  passedOut: number;
}

export async function getMureedsByPeer(): Promise<PeerBreakdown[]> {
  await latency();
  return PEERS.map((m) => {
    const rows = mureedStore.filter((x) => x.peerName === m.name);
    return {
      peerName: m.name,
      total: rows.length,
      available: rows.filter((r) => r.status === "Available").length,
      passedOut: rows.filter((r) => r.status === "Passed Out").length,
    };
  });
}
