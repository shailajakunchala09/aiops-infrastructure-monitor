import { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const TONE_TEXT = {
  healthy: "text-signal-healthy",
  warning: "text-signal-warning",
  critical: "text-signal-critical",
};

const TONE_GLOW = {
  healthy: "from-signal-healthy/15",
  warning: "from-signal-warning/15",
  critical: "from-signal-critical/15",
};

/** Animated count-up for numeric KPI values; falls back to a plain render for strings like "34.2 min". */
function useCountUp(value) {
  const numeric = typeof value === "number" ? value : parseFloat(value);
  const isAnimatable = !Number.isNaN(numeric) && /^-?[\d.]+$/.test(String(value ?? "").trim());
  const [display, setDisplay] = useState(isAnimatable ? 0 : value);
  const start = useRef(null);
  const from = useRef(0);

  useAnimationFrame((t) => {
    if (!isAnimatable) return;
    if (start.current === null) {
      start.current = t;
      from.current = typeof display === "number" ? display : 0;
    }
    const elapsed = t - start.current;
    const duration = 700;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    setDisplay(from.current + (numeric - from.current) * eased);
  });

  useEffect(() => {
    start.current = null;
  }, [value]);

  if (!isAnimatable) return value ?? "—";
  const isInt = Number.isInteger(numeric);
  return isInt ? Math.round(display).toLocaleString() : display.toFixed(1);
}

export function KpiCard({ label, value, tone, delta, icon: Icon, index = 0 }) {
  const animatedValue = useCountUp(value);
  const suffix = typeof value === "string" ? value.replace(/^[\d.]+/, "") : "";
  const displayValue =
    typeof value === "string" && /^[\d.]+/.test(value) ? `${animatedValue}${suffix}` : animatedValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="glass group relative rounded-xl p-5 overflow-hidden"
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          tone ? TONE_GLOW[tone] : "from-brand-500/10"
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider">{label}</div>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 group-hover:text-brand-400 transition-colors">
            <Icon size={14} strokeWidth={2.25} />
          </div>
        )}
      </div>
      <div
        className={cn(
          "relative mt-3 font-mono text-[30px] font-semibold leading-none tabular-nums",
          tone ? TONE_TEXT[tone] : "text-slate-50"
        )}
      >
        {displayValue}
      </div>
      {delta && (
        <div className="relative mt-2.5 flex items-center gap-1 text-[12px] text-slate-500">
          {delta.direction === "up" ? (
            <ArrowUpRight size={13} className="text-signal-healthy" />
          ) : delta.direction === "down" ? (
            <ArrowDownRight size={13} className="text-signal-critical" />
          ) : null}
          {delta.text ?? delta}
        </div>
      )}
    </motion.div>
  );
}

const STATUS_LABELS = {
  HEALTHY: "healthy",
  WARNING: "warning",
  CRITICAL: "critical",
  OFFLINE: "offline",
  UNKNOWN: "offline",
};

export function StatusPill({ status }) {
  const tone = STATUS_LABELS[status] || "offline";
  return (
    <Badge tone={tone} className={tone === "critical" ? "animate-pulse-dot" : ""}>
      {status}
    </Badge>
  );
}

const SEVERITY_TONE = {
  SEV1_CRITICAL: "critical",
  SEV2_HIGH: "warning",
  SEV3_MEDIUM: "info",
  SEV4_LOW: "offline",
};

export function SeverityBadge({ severity }) {
  const tone = SEVERITY_TONE[severity] || "neutral";
  return <Badge tone={tone}>{severity.replace("SEV", "SEV ").replace("_", " ")}</Badge>;
}
