import { cn } from "@/lib/utils";

/**
 * One badge component for every status in the app. Structure (padding, height,
 * min-width, radius, typography, alignment) is identical for all values — colour
 * is the only visual difference.
 */
const styles: Record<string, string> = {
  // Mureed statuses
  Available: "bg-success/12 text-success-foreground ring-success/30",
  "Passed Out": "bg-warning/15 text-warning-foreground ring-warning/35",
  // Account statuses
  Active: "bg-success/12 text-success-foreground ring-success/30",
  "Pending Setup": "bg-info/12 text-info-foreground ring-info/30",
  Inactive: "bg-muted text-muted-foreground ring-border",
  PENDING: "bg-info/12 text-info-foreground ring-info/30",
  APPROVED: "bg-success/12 text-success-foreground ring-success/30",
  REJECTED: "bg-destructive/10 text-destructive ring-destructive/25",
  // Roles
  Admin: "bg-primary/10 text-primary ring-primary/25",
  Mureed: "bg-muted text-muted-foreground ring-border",
};

const base =
  "inline-flex h-6 min-w-[104px] items-center justify-center whitespace-nowrap rounded-full px-3 text-center align-middle font-sans text-xs font-medium leading-none ring-1 ring-inset";

export function StatusBadge({
  value,
  className,
}: {
  value: string;
  className?: string | undefined;
}) {
  return <span className={cn(base, styles[value] ?? styles["Inactive"], className)}>{value}</span>;
}

/** Account status (Active / Pending Setup / Inactive) — same structure, own colours. */
export function AccountStatusBadge({
  value,
  className,
}: {
  value: string;
  className?: string | undefined;
}) {
  return <StatusBadge value={value} className={className} />;
}
