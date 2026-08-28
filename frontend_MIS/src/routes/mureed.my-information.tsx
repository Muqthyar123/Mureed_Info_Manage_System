import { formatPhone } from "@/utils/validation";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/AppShell";
import { InfoGrid } from "@/components/layout/InfoGrid";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { getMureed } from "@/services/mureedService";
import { formatAge, formatDate } from "@/utils/age";

export const Route = createFileRoute("/mureed/my-information")({
  head: () => ({
    meta: [
      { title: "My Information — Mureed Information Management System" },
      { name: "description", content: "View your complete registered Mureed information." },
      { property: "og:title", content: "My Information — MIMS" },
      { property: "og:description", content: "Your complete registered Mureed information." },
    ],
  }),
  component: MyInformation,
});

function MyInformation() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["mureed", user?.mureedId],
    queryFn: () => getMureed(user!.mureedId!),
    enabled: !!user?.mureedId,
    refetchInterval: 3000,
  });

  return (
    <>
      <PageHeader
        title="My Information"
        description="This information is maintained by the Admin and is read-only."
      />

      {isLoading || !data ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <InfoGrid
          items={[
            { label: "Mureed Name", value: data.name },
            { label: "Date of Birth", value: formatDate(data.dateOfBirth) },
            { label: "Age", value: formatAge(data.dateOfBirth) },
            { label: "Gender", value: data.gender },
            { label: "Address", value: data.address, full: true },
            { label: "Phone Number", value: formatPhone(data.phone) },
            { label: "Email", value: data.email },
            { label: "Peer Name", value: data.peerName },
            { label: "Mureed Status", value: <StatusBadge value={data.status} /> },
          ]}
        />
      )}
    </>
  );
}
