import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Network, UserCheck, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/AppShell";
import { StatCard } from "@/components/layout/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getMureedsByPeer, getOverviewStats } from "@/services/reportService";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Mureed Information Management System" },
      { name: "description", content: "Totals for Mureeds, statuses and distribution by Peer." },
      { property: "og:title", content: "Reports — MIMS" },
      { property: "og:description", content: "Mureed totals and distribution by Peer." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["overview"], queryFn: getOverviewStats });
  const { data: byPeer, isLoading: loadingChart } = useQuery({
    queryKey: ["by-peer"],
    queryFn: getMureedsByPeer,
  });

  return (
    <>
      <PageHeader title="Reports" description="Overview of Mureed records across the system." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Mureeds" value={stats?.totalMureeds ?? 0} icon={Users} loading={isLoading} />
        <StatCard
          label="Available Mureeds"
          value={stats?.availableMureeds ?? 0}
          icon={UserCheck}
          loading={isLoading}
        />
        <StatCard
          label="Passed Out Mureeds"
          value={stats?.passedOutMureeds ?? 0}
          icon={GraduationCap}
          loading={isLoading}
        />
        <StatCard label="Total Peer" value={stats?.totalPeer ?? 0} icon={Network} loading={isLoading} />
      </div>

      <div className="surface-card mt-6 p-5">
        <h2 className="text-base font-semibold">Mureeds by Peer</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Distribution of Mureed records across each Peer.
        </p>
        <div className="mt-5 h-80 w-full">
          {loadingChart ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPeer ?? []} margin={{ left: -12, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="peerName"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="available" name="Available" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="passedOut" name="Passed Out" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="surface-card mt-6 overflow-x-auto p-5">
        <h2 className="text-base font-semibold">Breakdown by Peer</h2>
        <table className="mt-4 w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 font-medium">Peer Name</th>
              <th className="px-3 py-3 font-medium">Total Mureeds</th>
              <th className="px-3 py-3 font-medium">Available</th>
              <th className="px-3 py-3 font-medium">Passed Out</th>
            </tr>
          </thead>
          <tbody>
            {(byPeer ?? []).map((row) => (
              <tr key={row.peerName} className="border-b border-border/70">
                <td className="px-3 py-3 font-medium">{row.peerName}</td>
                <td className="px-3 py-3">{row.total.toLocaleString()}</td>
                <td className="px-3 py-3">{row.available.toLocaleString()}</td>
                <td className="px-3 py-3">{row.passedOut.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
