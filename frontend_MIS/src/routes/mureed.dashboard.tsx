import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { InfoGrid } from "@/components/layout/InfoGrid";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { getMureed } from "@/services/mureedService";
import { formatAge } from "@/utils/age";

export const Route = createFileRoute("/mureed/dashboard")({
  head: () => ({
    meta: [
      { title: "Mureed Dashboard — Mureed Information Management System" },
      { name: "description", content: "Read-only overview of your own registered information." },
      { property: "og:title", content: "Mureed Dashboard — MIMS" },
      { property: "og:description", content: "Your registered information at a glance." },
    ],
  }),
  component: MureedDashboard,
});

function MureedDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["mureed", user?.mureedId],
    queryFn: () => getMureed(user!.mureedId!),
    enabled: !!user?.mureedId,
  });

  return (
    <>
      <PageHeader title="Dashboard" description="Your registered information, as recorded by the Admin." />

      {isLoading || !data ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <InfoGrid
          items={[
            { label: "Mureed Name", value: data.name },
            { label: "Age", value: formatAge(data.dateOfBirth) },
            { label: "Gender", value: data.gender },
            { label: "Mureed Status", value: <StatusBadge value={data.status} /> },
            { label: "Peer Name", value: data.peerName },
            { label: "Phone Number", value: data.phone },
            { label: "Email", value: data.email },
            { label: "Address", value: data.address, full: true },
          ]}
        />
      )}
    </>
  );
}
