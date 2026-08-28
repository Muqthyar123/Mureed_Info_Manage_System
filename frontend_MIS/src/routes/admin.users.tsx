import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MoreHorizontal, Search, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  deleteUser,
  listUsers,
  resendSetupEmail,
  setAccountStatus,
} from "@/services/userService";
import { MAIN_ADMIN_EMAIL } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import type { AppUser } from "@/types";
import { formatDate } from "@/utils/age";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — Mureed Information Management System" },
      { name: "description", content: "Manage Admin and Mureed accounts and their account status." },
      { property: "og:title", content: "User Management — MIMS" },
      { property: "og:description", content: "Manage account access for Admin and Mureed users." },
    ],
  }),
  component: UserManagement,
});

function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [toDelete, setToDelete] = useState<AppUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", search, role, status],
    queryFn: () => listUsers(search, role, status),
    refetchInterval: 3000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const { user } = useAuth();
  const isSubAdmin = user?.adminRole === "SUB_ADMIN";

  return (
    <>
      <PageHeader
        title="User Management"
        description="Mureed accounts are created from Add Mureed. Passwords are never visible to the Admin."
      />

      <div className="surface-card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="pl-9"
              aria-label="Search users"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger aria-label="Filter by role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Mureed">Mureed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter by account status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Account Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Pending Setup">Pending Setup</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Account Status</th>
                <th className="px-3 py-3 font-medium">Created Date</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/70">
                    <td colSpan={6} className="px-3 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : data && data.length > 0 ? (
                data.map((u) => {
                  const canManage = !isSubAdmin || u.role === "Mureed";
                  return (
                    <tr key={u.id} className="border-b border-border/70 hover:bg-muted/50">
                      <td className="px-3 py-3 font-medium">{u.name}</td>
                      <td className="px-3 py-3 text-muted-foreground font-mono text-xs sm:text-sm">{u.email}</td>
                      <td className="px-3 py-3">
                        <StatusBadge value={u.role} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge value={u.accountStatus} />
                      </td>
                      <td className="px-3 py-3">{formatDate(u.createdDate)}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Actions for ${u.name}`}>
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={!canManage || u.accountStatus === "Active" || u.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()}
                                onClick={async () => {
                                  try {
                                    await setAccountStatus(u.id, "Active");
                                    toast.success("Account activated", { description: u.email });
                                    refresh();
                                  } catch (err: any) {
                                    toast.error(err.message || "Failed to activate account");
                                  }
                                }}
                              >
                                Activate account
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canManage || u.accountStatus === "Inactive" || u.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()}
                                onClick={async () => {
                                  try {
                                    await setAccountStatus(u.id, "Inactive");
                                    toast.success("Account deactivated", { description: u.email });
                                    refresh();
                                  } catch (err: any) {
                                    toast.error(err.message || "Failed to deactivate account");
                                  }
                                }}
                              >
                                Deactivate account
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canManage || u.role !== "Mureed"}
                                onClick={async () => {
                                  try {
                                    await resendSetupEmail(u.id);
                                    toast.success("Account setup email sent", { description: u.email });
                                  } catch (err: any) {
                                    toast.error(err.message || "Failed to resend setup email");
                                  }
                                }}
                              >
                                <Mail className="size-4" />
                                Resend setup email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!canManage}
                                className="text-destructive focus:text-destructive"
                                onClick={() => setToDelete(u)}
                              >
                                Delete account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-16 text-center">
                    <UserCog className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium">No users found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try adjusting your search or filters.
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
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (toDelete) {
                  try {
                    await deleteUser(toDelete.id);
                    toast.success("Account deleted", { description: toDelete.email });
                    setToDelete(null);
                    refresh();
                    queryClient.invalidateQueries({ queryKey: ["mureeds"] });
                    queryClient.invalidateQueries({ queryKey: ["overview"] });
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete account");
                  }
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
