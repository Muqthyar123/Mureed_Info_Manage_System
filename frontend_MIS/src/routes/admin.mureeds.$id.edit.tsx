import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { MureedForm } from "@/components/forms/MureedForm";
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
import { getMureed, updateMureed } from "@/services/mureedService";
import { listPeerNames } from "@/services/peerService";
import type { MureedInput } from "@/types";

export const Route = createFileRoute("/admin/mureeds/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Mureed — Mureed Information Management System" },
      { name: "description", content: "Update a Mureed's registered information." },
      { property: "og:title", content: "Edit Mureed — MIMS" },
      { property: "og:description", content: "Update a Mureed's registered information." },
    ],
  }),
  component: EditMureedPage,
});

function EditMureedPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<MureedInput | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["mureed", id], queryFn: () => getMureed(id) });

  const { data: peerNames = [] } = useQuery({
    queryKey: ["peer-names"],
    queryFn: listPeerNames,
  });

  const save = async (value: MureedInput) => {
    setSubmitting(true);
    try {
      const updated = await updateMureed(id, value);
      queryClient.invalidateQueries({ queryKey: ["mureeds"] });
      queryClient.invalidateQueries({ queryKey: ["mureed", id] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      toast.success(updated.message || "Mureed updated successfully.");
      navigate({ to: "/admin/mureeds/$id", params: { id } });
    } catch (err: any) {
      toast.error(err.message || "Could not update Mureed.");
    } finally {
      setSubmitting(false);
      setPending(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Mureed not found.</p>;
  }

  const { id: _omit, ...initialValue } = data;
  initialValue.email = data.email || "";

  return (
    <>
      <PageHeader title="Edit Mureed" description={`Updating the record for ${data.name}.`} />

      <MureedForm
        initialValue={initialValue}
        peerNames={peerNames}
        submitLabel="Save Changes"
        submitting={submitting}
        onSubmit={(value) => {
          const prevEmail = (data.email || "").toLowerCase();
          const newEmail = (value.email || "").toLowerCase();
          if (newEmail !== prevEmail && prevEmail !== "" && newEmail !== "") setPending(value);
          else save(value);
        }}
        onCancel={() => navigate({ to: "/admin/mureeds/$id", params: { id } })}
      />

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change registered email?</AlertDialogTitle>
            <AlertDialogDescription>
              This email is linked to the Mureed's login account. Changing it from{" "}
              <strong className="text-foreground">{data.email}</strong> to{" "}
              <strong className="text-foreground">{pending?.email}</strong> will change the email
              they use to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pending) save(pending);
              }}
            >
              Confirm change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
