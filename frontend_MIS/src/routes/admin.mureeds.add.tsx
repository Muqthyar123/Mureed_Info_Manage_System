import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { MureedForm } from "@/components/forms/MureedForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createMureed } from "@/services/mureedService";
import { listPeerNames } from "@/services/peerService";
import { createMureedAccount } from "@/services/userService";
import type { MureedInput } from "@/types";

export const Route = createFileRoute("/admin/mureeds/add")({
  head: () => ({
    meta: [
      { title: "Add Mureed — Mureed Information Management System" },
      {
        name: "description",
        content: "Register a new Mureed and send an account setup email to their address.",
      },
      { property: "og:title", content: "Add Mureed — MIMS" },
      { property: "og:description", content: "Register a new Mureed record." },
    ],
  }),
  component: AddMureedPage,
});

import { playNotificationSound } from "@/utils/sound";

function AddMureedPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ email: string } | null>(null);

  const { data: peerNames = [] } = useQuery({
    queryKey: ["peer-names"],
    queryFn: listPeerNames,
  });

  const handleSubmit = async (value: MureedInput) => {
    setSubmitting(true);
    try {
      const mureed = await createMureed(value);
      queryClient.invalidateQueries({ queryKey: ["mureeds"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      playNotificationSound();
      const desc = mureed.message || (mureed.email ? `Invitation sent to ${mureed.email}` : "No email was provided, so login credentials were not sent.");
      toast.success("Mureed created successfully", { description: desc });
      if (mureed.email) {
        setCreated({ email: mureed.email });
      } else {
        navigate({ to: "/admin/mureeds" });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not create Mureed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Mureed"
        description="Enter the Mureed's information. An account setup email is sent to the address you provide."
      />

      <MureedForm
        peerNames={peerNames}
        submitLabel="Create Mureed Account"
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/admin/mureeds" })}
      />

      <Dialog open={!!created} onOpenChange={() => undefined}>
        <DialogContent>
          <DialogHeader>
            <CheckCircle2 className="size-8 text-success" />
            <DialogTitle>Mureed account created successfully.</DialogTitle>
            <DialogDescription>
              Account setup email sent to:{" "}
              <strong className="text-foreground">{created?.email}</strong>
              <br />
              The Mureed will create their own password from the setup link.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreated(null)}>
              Add another Mureed
            </Button>
            <Button onClick={() => navigate({ to: "/admin/mureeds" })}>Back to Mureeds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
