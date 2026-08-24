import type { ReactNode } from "react";

export interface InfoItem {
  label: string;
  value: ReactNode;
  full?: boolean;
}

export function InfoGrid({ items }: { items: InfoItem[] }) {
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`bg-card px-5 py-4 ${item.full ? "sm:col-span-2" : ""}`}
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1.5 text-sm font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
