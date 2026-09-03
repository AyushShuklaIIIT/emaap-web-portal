import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  "Pending Allocation": "bg-warning/15 text-warning-foreground border-warning/30",
  "In Field Inspection": "bg-primary/10 text-primary border-primary/20",
  Verified: "bg-success/10 text-success border-success/20",
  Expired: "bg-error/10 text-error border-error/20",
  "Action Required": "bg-error/10 text-error border-error/20",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border-slate-200",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "Draft" && "bg-slate-400",
          status === "Pending Allocation" && "bg-warning",
          status === "In Field Inspection" && "bg-primary",
          status === "Verified" && "bg-success",
          (status === "Expired" || status === "Action Required") &&
            "bg-error",
        )}
      />
      {status}
    </span>
  );
}
