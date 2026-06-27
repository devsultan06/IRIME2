import { cn } from "@/lib/utils";

interface MetricCardProps {
  value: string | number;
  label: string;
  variant?: "default" | "flag";
}

export function MetricCard({
  value,
  label,
  variant = "default",
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-5 text-center border transition-all",
        variant === "flag"
          ? "bg-rose-950/20 border-rose-900/60"
          : "bg-zinc-900 border-zinc-800"
      )}
    >
      <p
        className={cn(
          "text-2xl sm:text-3xl font-bold font-mono leading-none",
          variant === "flag" ? "text-rose-400" : "text-white"
        )}
      >
        {value}
      </p>
      <p className="text-[0.7rem] uppercase tracking-widest text-zinc-500 font-semibold mt-2">
        {label}
      </p>
    </div>
  );
}
