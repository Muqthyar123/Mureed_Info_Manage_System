import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportFormat } from "@/utils/export";

const FORMATS: { id: ExportFormat; label: string; icon: typeof FileText }[] = [
  { id: "xlsx", label: "Excel (.xlsx)", icon: FileSpreadsheet },
  { id: "csv", label: "CSV (.csv)", icon: Table2 },
  { id: "pdf", label: "PDF (.pdf)", icon: FileText },
];

export function ExportMenu({
  onExport,
  disabled,
  hint,
}: {
  onExport: (format: ExportFormat) => Promise<void>;
  disabled?: boolean;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);

  const run = async (format: ExportFormat) => {
    setBusy(true);
    try {
      await onExport(format);
      toast.success(`Export ready (${format.toUpperCase()})`);
    } catch {
      toast.error("Could not generate the export.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} loading={busy} loadingText="Exporting...">
          {!busy && <Download className="size-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {hint ?? "Download the current data"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FORMATS.map((f) => (
          <DropdownMenuItem key={f.id} onSelect={() => void run(f.id)}>
            <f.icon className="size-4" />
            {f.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
