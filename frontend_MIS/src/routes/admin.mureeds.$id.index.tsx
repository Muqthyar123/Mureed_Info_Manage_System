import { formatPhone } from "@/utils/validation";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { InfoGrid } from "@/components/layout/InfoGrid";
import { StatusBadge } from "@/components/layout/StatusBadge";
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
import { deleteMureed, getMureed } from "@/services/mureedService";
import { formatAge, formatDate } from "@/utils/age";

export const Route = createFileRoute("/admin/mureeds/$id/")({
  head: () => ({
    meta: [
      { title: "Mureed Details — Mureed Information Management System" },
      { name: "description", content: "View the full information recorded for a single Mureed." },
      { property: "og:title", content: "Mureed Details — MIMS" },
      { property: "og:description", content: "Full record for a single Mureed." },
    ],
  }),
  component: MureedDetails,
});

function MureedDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["mureed", id], queryFn: () => getMureed(id) });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="surface-card p-10 text-center">
        <p className="font-medium">Mureed not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This record may have been deleted.
        </p>
        <Button className="mt-5" onClick={() => navigate({ to: "/admin/mureeds" })}>
          Back to Mureeds
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMureed(data.id);
      queryClient.invalidateQueries({ queryKey: ["mureeds"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      toast.success("Mureed deleted", { description: data.name });
      navigate({ to: "/admin/mureeds", replace: true });
    } catch {
      toast.error("Could not delete Mureed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={data.name}
        description="Mureed Information"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: "/admin/mureeds" })}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/admin/mureeds/$id/edit", params: { id: data.id } })}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setConfirm(true)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </>
        }
      />

      <InfoGrid
        items={[
          { label: "Mureed Name", value: data.name },
          { label: "Date of Birth", value: formatDate(data.dateOfBirth) },
          { label: "Age", value: formatAge(data.dateOfBirth) },
          { label: "Gender", value: data.gender },
          { label: "Address", value: data.address, full: true },
          { label: "Phone Number", value: formatPhone(data.phone) || "Not Provided" },
          { label: "Email", value: data.email || "Not Provided" },
          { label: "Peer Name", value: data.peerName },
          { label: "Mureed Status", value: <StatusBadge value={data.status} /> },
        ]}
      />

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mureed?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this Mureed? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
