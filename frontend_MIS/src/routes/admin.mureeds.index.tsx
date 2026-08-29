import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Eye, Mail, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ExportMenu } from "@/components/common/ExportMenu";
import { deleteMureed, listLocations, listMureeds, listMureedsForExport } from "@/services/mureedService";
import { exportRows, type ExportFormat } from "@/utils/export";
import { formatPhone } from "@/utils/validation";
import { locationFromAddress } from "@/utils/location";
import { listPeerNames } from "@/services/peerService";
import type { Mureed } from "@/types";
import { calculateAge } from "@/utils/age";

const PAGE_SIZE = 25;

export const Route = createFileRoute("/admin/mureeds/")({
  head: () => ({
    meta: [
      { title: "Mureed Management — Mureed Information Management System" },
      {
        name: "description",
        content: "Search, filter, sort and manage every Mureed record in the system.",
      },
      { property: "og:title", content: "Mureed Management — MIMS" },
      { property: "og:description", content: "Manage all Mureed records." },
    ],
  }),
  component: MureedManagement,
});

function MureedManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [peerName, setPeerName] = useState("all");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "age" | "peerName">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Mureed | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: peerNames = [] } = useQuery({
    queryKey: ["peer-names"],
    queryFn: listPeerNames,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: listLocations,
  });

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: debounced,
    peerName,
    gender,
    status,
    location,
    sortBy,
    sortDir,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["mureeds", query],
    queryFn: () => listMureeds(query),
    placeholderData: keepPreviousData,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      const rows = await listMureedsForExport(query);
      if (!rows || rows.length === 0) {
        toast.info("No Mureed records match the current filter to export.");
        return;
      }
      await exportRows({
        format,
        rows,
        filename: `mureeds-${new Date().toISOString().slice(0, 10)}`,
        title: "Mureed Records",
        columns: [
          { header: "Mureed Name", value: (m) => m.name },
          { header: "Date of Birth", value: (m) => m.dateOfBirth },
          { header: "Age", value: (m) => String(calculateAge(m.dateOfBirth) ?? "") },
          { header: "Gender", value: (m) => m.gender },
          { header: "Address", value: (m) => m.address },
          { header: "Location", value: (m) => locationFromAddress(m.address) },
          { header: "Phone Number", value: (m) => formatPhone(m.phone) },
          { header: "Email", value: (m) => m.email },
          { header: "Peer Name", value: (m) => m.peerName },
          { header: "Mureed Status", value: (m) => m.status },
        ],
      });
      toast.success(`Exported ${rows.length} Mureed records (${format.toUpperCase()})`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export Mureed records.");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteMureed(toDelete.id);
      toast.success("Mureed deleted", { description: toDelete.name });
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["mureeds"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
    } catch {
      toast.error("Could not delete Mureed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Mureed Management"
        description="Add, view, edit and remove Mureed records."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu onExport={handleExport} hint="Exports the filtered records" />
            <Button onClick={() => navigate({ to: "/admin/mureeds/add" })}>
              <Plus className="size-4" />
              Add Mureed
            </Button>
          </div>
        }
      />

      <div className="surface-card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or phone"
              className="pl-9"
              aria-label="Search Mureeds"
            />
          </div>
          <FilterSelect
            label="Peer Name"
            value={peerName}
            onChange={(v) => {
              setPeerName(v);
              setPage(1);
            }}
            options={peerNames}
          />
          <FilterSelect
            label="Gender"
            value={gender}
            onChange={(v) => {
              setGender(v);
              setPage(1);
            }}
            options={["Male", "Female"]}
          />
          <FilterSelect
            label="Location"
            value={location}
            onChange={(v) => {
              setLocation(v);
              setPage(1);
            }}
            options={locations}
          />
          <FilterSelect
            label="Mureed Status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={["Available", "Passed Out"]}
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <Th onClick={() => toggleSort("name")} sortable>
                  Mureed Name
                </Th>
                <Th onClick={() => toggleSort("age")} sortable>
                  Age
                </Th>
                <Th>Gender</Th>
                <Th>Address</Th>
                <Th>Phone Number</Th>
                <Th>Email</Th>
                <Th onClick={() => toggleSort("peerName")} sortable>
                  Peer Name
                </Th>
                <Th>Mureed Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/70">
                    <td colSpan={9} className="px-3 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : data && data.rows.length > 0 ? (
                data.rows.map((m) => (
                  <tr key={m.id} className="border-b border-border/70 transition-colors hover:bg-muted/50">
                    <td className="px-3 py-3 font-medium">{m.name}</td>
                    <td className="px-3 py-3">{calculateAge(m.dateOfBirth)}</td>
                    <td className="px-3 py-3">{m.gender}</td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-muted-foreground">
                      {m.address}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{formatPhone(m.phone)}</td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-muted-foreground">
                      {m.email}
                    </td>
                    <td className="px-3 py-3">{m.peerName}</td>
                    <td className="px-3 py-3">
                      <StatusBadge value={m.status} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to="/admin/mureeds/$id" params={{ id: m.id }} aria-label={`View ${m.name}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link
                          to="/admin/mureeds/$id/edit"
                          params={{ id: m.id }}
                          aria-label={`Edit ${m.name}`}
                        >
                          <Button variant="ghost" size="icon">
                            <Pencil className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={`Resend Brevo invitation to ${m.email}`}
                          aria-label={`Resend invitation to ${m.name}`}
                          onClick={async () => {
                            try {
                              const { resendMureedInvitation } = await import("@/services/mureedService");
                              await resendMureedInvitation(m.id);
                              toast.success(`Invitation email sent to ${m.email}`);
                            } catch {
                              toast.error(`Could not resend invitation to ${m.email}`);
                            }
                          }}
                        >
                          <Mail className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${m.name}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setToDelete(m)}
                        >
                          <Trash2 className="size-4" />
                        </Button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-3 py-16 text-center">
                    <Users className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium">No Mureeds found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {isFetching && !isLoading ? "Updating… " : ""}
            Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
          </p>
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mureed?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this Mureed? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleting}
              loadingText="Deleting..."
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Th({
  children,
  onClick,
  sortable,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  sortable?: boolean;
  className?: string;
}) {
  return (
    <th className={`px-3 py-3 font-medium ${className}`}>
      {sortable ? (
        <button
          onClick={onClick}
          className="inline-flex items-center gap-1 uppercase hover:text-foreground"
        >
          {children}
          <ArrowUpDown className="size-3" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => windowStart + i);

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === page ? "default" : "ghost"}
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
