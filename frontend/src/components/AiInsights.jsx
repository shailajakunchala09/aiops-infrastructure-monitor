import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ShieldAlert, CircleCheck, ServerCrash } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * Pure function: turns already-fetched dashboard state (stats/servers/incidents)
 * into a short list of human-readable operational insights. Everything here is
 * derived client-side from data the Overview page already has in memory - no
 * additional API calls, no backend changes.
 */
function computeInsights({ stats, servers = [], incidents = [] }) {
  const insights = [];

  if (!stats) return insights;

  if (stats.critical_servers > 0) {
    const names = servers
      .filter((s) => s.status === "CRITICAL")
      .map((s) => s.hostname)
      .slice(0, 3)
      .join(", ");
    insights.push({
      icon: ServerCrash,
      tone: "critical",
      title: `${stats.critical_servers} server${stats.critical_servers > 1 ? "s" : ""} in critical state`,
      detail: names ? `Affected: ${names}${stats.critical_servers > 3 ? ", ..." : ""}` : "Investigate immediately.",
    });
  }

  if (stats.active_incidents > 0) {
    const bySeverity = incidents.filter((i) => i.severity === "SEV1_CRITICAL").length;
    insights.push({
      icon: ShieldAlert,
      tone: "warning",
      title: `${stats.active_incidents} incident${stats.active_incidents > 1 ? "s" : ""} currently open`,
      detail: bySeverity > 0 ? `${bySeverity} rated SEV1 - recommend prioritizing these first.` : "None rated SEV1 right now.",
    });
  }

  if (stats.uptime_percentage >= 99.5 && stats.critical_servers === 0) {
    insights.push({
      icon: CircleCheck,
      tone: "healthy",
      title: `Fleet uptime holding at ${stats.uptime_percentage}%`,
      detail: "All monitored infrastructure within healthy thresholds.",
    });
  }

  if (stats.warning_servers >= 2) {
    insights.push({
      icon: TrendingUp,
      tone: "info",
      title: `${stats.warning_servers} servers trending toward warning thresholds`,
      detail: "Consider reviewing resource allocation before they escalate to critical.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: CircleCheck,
      tone: "healthy",
      title: "No anomalies detected",
      detail: "All systems operating within normal parameters.",
    });
  }

  return insights;
}

const TONE_STYLES = {
  critical: "bg-signal-critical-dim text-signal-critical",
  warning: "bg-signal-warning-dim text-signal-warning",
  healthy: "bg-signal-healthy-dim text-signal-healthy",
  info: "bg-signal-info-dim text-signal-info",
};

export default function AiInsights({ stats, servers, incidents }) {
  const insights = computeInsights({ stats, servers, incidents });

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand-500/10 blur-3xl" />
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-gradient flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <CardTitle>AI Insights</CardTitle>
        </div>
        <span className="text-[10.5px] font-mono text-slate-500 uppercase tracking-wide">Auto-generated</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="flex gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${TONE_STYLES[insight.tone]}`}>
              <insight.icon size={14} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-slate-200">{insight.title}</div>
              <div className="text-[12px] text-slate-500 mt-0.5">{insight.detail}</div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
