import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold font-mono uppercase tracking-wide",
  {
    variants: {
      tone: {
        healthy: "bg-signal-healthy-dim text-signal-healthy",
        warning: "bg-signal-warning-dim text-signal-warning",
        critical: "bg-signal-critical-dim text-signal-critical",
        offline: "bg-signal-offline-dim text-signal-offline",
        info: "bg-signal-info-dim text-signal-info",
        neutral: "bg-white/5 text-slate-400",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

const DOT_COLOR = {
  healthy: "bg-signal-healthy shadow-[0_0_6px_rgba(34,211,168,0.8)]",
  warning: "bg-signal-warning shadow-[0_0_6px_rgba(246,173,60,0.8)]",
  critical: "bg-signal-critical shadow-[0_0_6px_rgba(251,90,103,0.8)]",
  offline: "bg-signal-offline",
  info: "bg-signal-info",
  neutral: "bg-slate-400",
};

export function Badge({ className, tone = "neutral", dot = true, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", DOT_COLOR[tone])} />}
      {children}
    </span>
  );
}
