import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/types";
import { Clock, CheckCircle2, Flag } from "lucide-react";

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

const config: Record<
  SubmissionStatus,
  { bg: string; text: string; icon: typeof Clock; label: string }
> = {
  Pending: {
    bg: "bg-amber-500/12 border-amber-500/25",
    text: "text-amber-400",
    icon: Clock,
    label: "Pending",
  },
  Reviewed: {
    bg: "bg-emerald-500/12 border-emerald-500/25",
    text: "text-emerald-400",
    icon: CheckCircle2,
    label: "Reviewed",
  },
  Flagged: {
    bg: "bg-rose-500/12 border-rose-500/25",
    text: "text-rose-400",
    icon: Flag,
    label: "Flagged",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const c = config[status];
  const Icon = c.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border",
        c.bg,
        c.text,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}
