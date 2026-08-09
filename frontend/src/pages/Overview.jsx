import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Server, Activity, ShieldAlert, Zap, AlertTriangle } from "lucide-react";
import { KpiCard, StatusPill } from "../components/Kpi";
import AiInsights from "../components/AiInsights";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkeletonKpiCard, SkeletonPanel, SkeletonTable } from "@/components/ui/skeleton";
import { dashboardApi, incidentApi, serverApi } from "../services/api";

const STATUS_COLORS = {
  HEALTHY: "#22d3a8",
  WARNING: "#f6ad3c",
  CRITICAL: "#fb5a67",
  OFFLINE: "#64748b",
};

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [servers, setServers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [overviewRes, serversRes, incidentsRes] = await Promise.all([
          dashboardApi.overview(),
          serverApi.list(),
          incidentApi.list({ status: "OPEN" }),
        ]);
        setStats(overviewRes.data);
        setServers(serversRes.data);
        setIncidents(incidentsRes.data.slice(0, 5));
      } catch {
        setError("Unable to load dashboard data. Is the API running?");
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="text-center text-slate-500 py-10">{error}</CardContent>
      </Card>
    );
  }

  const pieData = stats
    ? [
        { name: "Healthy", value: stats.healthy_servers },
        { name: "Warning", value: stats.warning_servers },
        { name: "Critical", value: stats.critical_servers },
        { name: "Offline", value: stats.offline_servers },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-50 tracking-tight">Operations Overview</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Real-time fleet health across all registered infrastructure
          </p>
        </div>
        <div className="text-[11.5px] font-mono text-slate-600">Auto-refreshing every 15s</div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonKpiCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard index={0} icon={Server} label="Total Servers" value={stats?.total_servers ?? "—"} />
          <KpiCard
            index={1}
            icon={Activity}
            label="System Uptime"
            value={stats ? `${stats.uptime_percentage}%` : "—"}
            tone={stats && stats.uptime_percentage >= 99 ? "healthy" : "warning"}
          />
          <KpiCard
            index={2}
            icon={ShieldAlert}
            label="Active Incidents"
            value={stats?.active_incidents ?? "—"}
            tone={stats?.active_incidents > 0 ? "critical" : "healthy"}
          />
          <KpiCard
            index={3}
            icon={Zap}
            label="Critical Alerts (24h)"
            value={stats?.critical_alerts_last_24h ?? "—"}
            tone={stats?.critical_alerts_last_24h > 0 ? "warning" : "healthy"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <>
              <SkeletonPanel height={220} />
              <SkeletonPanel height={220} />
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Health Distribution</CardTitle>
                </CardHeader>
                <CardContent style={{ height: 220 }}>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name.toUpperCase()]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#111827",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[13px] text-slate-600">
                      No servers registered yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Open Incidents</CardTitle>
                </CardHeader>
                {incidents.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {incidents.map((inc, i) => (
                      <motion.div
                        key={inc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between gap-3 px-5 py-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AlertTriangle size={14} className="shrink-0 text-signal-warning" />
                          <span className="text-[13px] text-slate-300 truncate">{inc.title}</span>
                        </div>
                        <span className="shrink-0 text-[11px] font-mono text-slate-500">
                          {inc.severity.replace("SEV", "SEV ").replace("_", " ")}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <CardContent className="text-center text-[13px] text-slate-600 py-10">
                    No open incidents. Fleet is stable.
                  </CardContent>
                )}
              </Card>
            </>
          )}
        </div>

        <AiInsights stats={stats} servers={servers} incidents={incidents} />
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Servers</CardTitle>
          </CardHeader>
          {servers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-white/10">
                    <th className="px-5 py-2.5 font-semibold">Hostname</th>
                    <th className="px-5 py-2.5 font-semibold">Environment</th>
                    <th className="px-5 py-2.5 font-semibold">Provider / Region</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold">Last Heartbeat</th>
                  </tr>
                </thead>
                <tbody>
                  {servers.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-200">{s.hostname}</td>
                      <td className="px-5 py-3 text-slate-400">{s.environment}</td>
                      <td className="px-5 py-3 text-slate-400">
                        {s.cloud_provider || "—"} / {s.region || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500 text-[12px]">
                        {s.last_heartbeat_at ? new Date(s.last_heartbeat_at).toLocaleString() : "never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent className="text-center text-[13px] text-slate-600 py-10">
              No servers registered. Install the monitoring agent and register a host to get started.
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
