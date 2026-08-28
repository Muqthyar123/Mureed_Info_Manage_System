import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Network, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  createPeer,
  deletePeer,
  listPeer,
  updatePeer,
  type PeerRow,
} from "@/services/peerService";
import { ExportMenu } from "@/components/common/ExportMenu";
import { exportRows, type ExportFormat } from "@/utils/export";

export const Route = createFileRoute("/admin/peer")({
  head: () => ({
    meta: [
      { title: "Peer Management — Mureed Information Management System" },
      { name: "description", content: "Add, edit, search and remove Peer records." },
      { property: "og:title", content: "Peer Management — MIMS" },
      { property: "og:description", content: "Manage Peer records and their Mureed counts." },
    ],
  }),
  component: PeerManagement,
});

function PeerManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<PeerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [toDelete, setToDelete] = useState<PeerRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["peer", search, status],
    queryFn: () => listPeer(search, status),
    refetchInterval: 3000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["peer"] });
    queryClient.invalidateQueries({ queryKey: ["peer-names"] });
    queryClient.invalidateQueries({ queryKey: ["overview"] });
  };

  const handleExport = async (format: ExportFormat) => {
    await exportRows({
      format,
      rows: data ?? [],
      filename: `peers-${new Date().toISOString().slice(0, 10)}`,
      title: "Peer Records",
      columns: [
        { header: "Peer Name", value: (r) => r.name },
        { header: "Number of Mureeds", value: (r) => String(r.mureedCount) },
        { header: "Status", value: (r) => r.status },
      ],
    });
  };

  const openCreate = () => {
    setName("");
    setFormStatus("Active");
    setCreating(true);
  };

  const openEdit = (row: PeerRow) => {
    setName(row.name);
    setFormStatus(row.status);
    setEditing(row);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Peer Name is required.");
      return;
    }
    if (editing) {
      await updatePeer(editing.id, name.trim(), formStatus);
      toast.success("Peer updated");
    } else {
      await createPeer(name.trim(), formStatus);
      toast.success("Peer added");
    }
    setEditing(null);
    setCreating(false);
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Peer Management"
        description="Maintain the list of Peer available for Mureed records."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              onExport={handleExport}
              disabled={!data || data.length === 0}
              hint="Exports the listed Peers"
            />
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add Peer
            </Button>
          </div>
        }
      />

      <div className="surface-card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Peer Name"
              className="pl-9"
              aria-label="Search Peer"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-medium">Peer Name</th>
                <th className="px-3 py-3 font-medium">Number of Mureeds</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/70">
                    <td colSpan={4} className="px-3 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : data && data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 hover:bg-muted/50">
                    <td className="px-3 py-3 font-medium">{row.name}</td>
                    <td className="px-3 py-3">{row.mureedCount.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${row.name}`}
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${row.name}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setToDelete(row)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-16 text-center">
                    <Network className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium">No Peer found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try a different search or filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Peer" : "Add Peer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="peer-name" className="mb-2 block">
                Peer Name
              </Label>
              <Input
                id="peer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Peer Name"
              />
            </div>
            <div>
              <Label className="mb-2 block">Status</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as "Active" | "Inactive")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Add Peer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Peer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this Peer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (toDelete) {
                  await deletePeer(toDelete.id);
                  toast.success("Peer deleted", { description: toDelete.name });
                  setToDelete(null);
                  refresh();
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
