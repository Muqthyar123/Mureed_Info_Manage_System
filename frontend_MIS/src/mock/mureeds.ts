import type { AppUser, Peer, Mureed } from "@/types";

/** Deterministic pseudo-random generator so mock data is stable across renders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const PEER_NAMES = [
  "Qadri",
  "Chishti",
  "Naqshbandi",
  "Suhrawardi",
  "Shadhili",
  "Rifai",
  "Kubrawi",
  "Bektashi",
];

const FIRST = [
  "Abdul",
  "Muqthyar",
  "Ayesha",
  "Bilal",
  "Fatima",
  "Hamza",
  "Imran",
  "Junaid",
  "Khadija",
  "Layla",
  "Mohsin",
  "Nadia",
  "Omar",
  "Rukhsana",
  "Saif",
  "Tahira",
  "Usman",
  "Wasim",
  "Yasmin",
  "Zoya",
];

const LAST = [
  "Ahmed",
  "Khan",
  "Siddiqui",
  "Sheikh",
  "Ansari",
  "Qureshi",
  "Baig",
  "Farooqui",
  "Hashmi",
  "Rahman",
];

const CITIES = [
  "Hyderabad",
  "Vijayawada",
  "Bengaluru",
  "Chennai",
  "Nagpur",
  "Pune",
  "Bhopal",
  "Lucknow",
  "Kurnool",
  "Warangal",
];

const STREETS = ["Main Road", "Station Street", "Gulshan Colony", "Noor Nagar", "Chowk Bazaar"];

export const PEERS: Peer[] = PEER_NAMES.map((name, i) => ({
  id: `mr-${i + 1}`,
  name,
  status: i === PEER_NAMES.length - 1 ? "Inactive" : "Active",
}));

const TOTAL_RECORDS = 10000;

function buildMureeds(): Mureed[] {
  const rand = rng(20260823);
  const rows: Mureed[] = [];
  for (let i = 1; i <= TOTAL_RECORDS; i += 1) {
    const first = FIRST[Math.floor(rand() * FIRST.length)] as string;
    const last = LAST[Math.floor(rand() * LAST.length)] as string;
    const gender = ["Ayesha", "Fatima", "Khadija", "Layla", "Nadia", "Rukhsana", "Tahira", "Yasmin", "Zoya"].includes(
      first,
    )
      ? "Female"
      : "Male";
    const year = 1975 + Math.floor(rand() * 35);
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);
    const peerName = PEER_NAMES[Math.floor(rand() * PEER_NAMES.length)] as string;
    const status = rand() > 0.32 ? "Available" : "Passed Out";
    rows.push({
      id: `MRD-${String(i).padStart(5, "0")}`,
      name: `${first} ${last}`,
      dateOfBirth: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      gender: gender as Mureed["gender"],
      address: `${1 + Math.floor(rand() * 200)}, ${STREETS[Math.floor(rand() * STREETS.length)]!}, ${
        CITIES[Math.floor(rand() * CITIES.length)]!
      }`,
      phone: `9${String(100000000 + Math.floor(rand() * 899999999)).slice(0, 9)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      peerName,
      status: status as Mureed["status"],
    });
  }
  return rows;
}

/** Single shared in-memory data source used by all services. */
export const mureedStore: Mureed[] = buildMureeds();

export const DEMO_MUREED_EMAIL = mureedStore[0]!.email;

export const userStore: AppUser[] = [
  {
    id: "usr-admin",
    name: "System Admin",
    email: "admin@mims.app",
    role: "Admin",
    accountStatus: "Active",
    createdDate: "2026-01-04",
  },
  ...mureedStore.slice(0, 40).map((m, i) => ({
    id: `usr-${m.id}`,
    name: m.name,
    email: m.email,
    role: "Mureed" as const,
    accountStatus: (i % 7 === 0 ? "Pending Setup" : i % 11 === 0 ? "Inactive" : "Active") as AppUser["accountStatus"],
    createdDate: `2026-0${1 + (i % 8)}-${String(1 + (i % 27)).padStart(2, "0")}`,
    mureedId: m.id,
  })),
];
