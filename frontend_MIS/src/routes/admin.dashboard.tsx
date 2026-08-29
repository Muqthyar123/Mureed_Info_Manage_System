import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Clock,
  GraduationCap,
  List,
  Network,
  Plus,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import {
  approveAdminRequest,
  deleteAdminRequest,
  listAdminApprovalRequests,
  rejectAdminRequest,
  MAIN_ADMIN_EMAIL,
} from "@/services/authService";
import type { AdminApprovalRequest } from "@/types";
import { formatDate } from "@/utils/age";
import { getOverviewStats } from "@/services/reportService";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Mureed Information Management System" },
      { name: "description", content: "Overview of Mureed and Peer records." },
      { property: "og:title", content: "Admin Dashboard — MIMS" },
      { property: "og:description", content: "Overview of Mureed and Peer records." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: getOverviewStats,
    retry: false,
  });
  const isMainAdmin =
    user?.adminRole === "MAIN_ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["admin-approval-requests"],
    queryFn: listAdminApprovalRequests,
    enabled: isMainAdmin,
    retry: false,
  });

  const refreshRequests = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-approval-requests"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["overview"] });
  };

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of the Mureed information system." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Mureeds"
          value={data?.totalMureeds ?? 0}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          label="Available Mureeds"
          value={data?.availableMureeds ?? 0}
          icon={UserCheck}
          loading={isLoading}
        />
        <StatCard
          label="Passed Out Mureeds"
          value={data?.passedOutMureeds ?? 0}
          icon={GraduationCap}
          loading={isLoading}
        />
        <StatCard
          label="Total Peer"
          value={data?.totalPeer ?? 0}
          icon={Network}
          loading={isLoading}
        />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickAction to="/admin/mureeds/add" label="Add Mureed" icon={Plus} />
          <QuickAction to="/admin/mureeds" label="View Mureeds" icon={List} />
          <QuickAction to="/admin/peer" label="View Peer" icon={Network} />
        </div>
      </section>

      {isMainAdmin && (
        <AdminApprovalRequests
          requests={requests ?? []}
          loading={requestsLoading}
          onApprove={async (request) => {
            await approveAdminRequest(request.id);
            toast.success("Admin request approved", { description: request.email });
            refreshRequests();
          }}
          onReject={async (request) => {
            await rejectAdminRequest(request.id);
            toast.success("Admin request rejected", { description: request.email });
            refreshRequests();
          }}
          onDelete={async (request) => {
            await deleteAdminRequest(request.id);
            toast.success("Admin request deleted", { description: request.email });
            refreshRequests();
          }}
        />
      )}
    </>
  );
}

function AdminApprovalRequests({
  requests,
  loading,
  onApprove,
  onReject,
  onDelete,
}: {
  requests: AdminApprovalRequest[];
  loading: boolean;
  onApprove: (request: AdminApprovalRequest) => Promise<void>;
  onReject: (request: AdminApprovalRequest) => Promise<void>;
  onDelete: (request: AdminApprovalRequest) => Promise<void>;
}) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminApprovalRequest | null>(null);

  const handleAction = async (id: string, type: "approve" | "reject" | "delete", fn: () => Promise<void>) => {
    setActiveAction(`${id}-${type}`);
    try {
      await fn();
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Admin Approval Requests
      </h2>
      <div className="surface-card mt-3 p-4 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Method</th>
                <th className="px-3 py-3 font-medium">Requested Date</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b border-border/70">
                    <td colSpan={6} className="px-3 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : requests.length > 0 ? (
                requests.map((request) => {
                  const isApproving = activeAction === `${request.id}-approve`;
                  const isRejecting = activeAction === `${request.id}-reject`;
                  const isDeleting = activeAction === `${request.id}-delete`;
                  const isBusy = activeAction !== null;

                  return (
                    <tr key={request.id} className="border-b border-border/70 hover:bg-muted/50">
                      <td className="px-3 py-3 font-medium">{request.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{request.email}</td>
                      <td className="px-3 py-3">
                        <StatusBadge value={request.status} />
                      </td>
                      <td className="px-3 py-3 capitalize">{request.authMethod}</td>
                      <td className="px-3 py-3">{formatDate(request.requestedDate)}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={request.status !== "PENDING" || isBusy}
                            loading={isApproving}
                            loadingText="Approving..."
                            onClick={() => handleAction(request.id, "approve", () => onApprove(request))}
                          >
                            {!isApproving && <Check className="size-4" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={request.status !== "PENDING" || isBusy}
                            loading={isRejecting}
                            loadingText="Rejecting..."
                            onClick={() => handleAction(request.id, "reject", () => onReject(request))}
                          >
                            {!isRejecting && <X className="size-4" />}
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                            loading={isDeleting}
                            loadingText="Deleting..."
                            onClick={() => setToDelete(request)}
                          >
                            {!isDeleting && <Trash2 className="size-4" />}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-16 text-center">
                    <Clock className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium">No approval requests</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      New Admin registrations will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin Approval Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the approval request for{" "}
              <span className="font-semibold text-foreground">{toDelete?.name}</span> ({toDelete?.email})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activeAction !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={activeAction !== null}
              onClick={async (e) => {
                e.preventDefault();
                if (toDelete) {
                  const req = toDelete;
                  await handleAction(req.id, "delete", () => onDelete(req));
                  setToDelete(null);
                }
              }}
            >
              {activeAction?.endsWith("-delete") ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function QuickAction({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Plus }) {
  return (
    <Link
      to={to}
      className="surface-card group flex items-center justify-between gap-3 p-4 transition-colors hover:border-primary/40"
    >
      <span className="flex items-center gap-3 text-sm font-medium">
        <span className="rounded-lg bg-accent p-2 text-accent-foreground">
          <Icon className="size-4" />
        </span>
        {label}
      </span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
