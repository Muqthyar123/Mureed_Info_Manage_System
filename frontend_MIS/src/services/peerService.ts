import { PEERS, mureedStore } from "@/mock/mureeds";
import type { Peer } from "@/types";

const latency = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export interface PeerRow extends Peer {
  mureedCount: number;
}

export async function listPeer(search?: string, status?: string): Promise<PeerRow[]> {
  await latency();
  let rows: PeerRow[] = PEERS.map((m) => ({
    ...m,
    mureedCount: mureedStore.filter((x) => x.peerName === m.name).length,
  }));
  const term = search?.trim().toLowerCase();
  if (term) rows = rows.filter((r) => r.name.toLowerCase().includes(term));
  if (status && status !== "all") rows = rows.filter((r) => r.status === status);
  return rows;
}

export async function listPeerNames(): Promise<string[]> {
  await latency(80);
  return PEERS.map((m) => m.name);
}

export async function createPeer(name: string, status: Peer["status"]): Promise<Peer> {
  await latency(250);
  const next: Peer = { id: `mr-${PEERS.length + 1}`, name, status };
  PEERS.push(next);
  return next;
}

export async function updatePeer(id: string, name: string, status: Peer["status"]) {
  await latency(250);
  const item = PEERS.find((m) => m.id === id);
  if (!item) throw new Error("Peer not found");
  item.name = name;
  item.status = status;
  return item;
}

export async function deletePeer(id: string) {
  await latency(250);
  const i = PEERS.findIndex((m) => m.id === id);
  if (i !== -1) PEERS.splice(i, 1);
}
