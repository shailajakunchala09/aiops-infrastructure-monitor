import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { KpiCard, StatusPill } from "../components/Kpi";
import { dashboardApi, incidentApi, serverApi } from "../services/api";

const STATUS_COLORS = {
  HEALTHY: "#35d0a1",
  WARNING: "#f0a83c",
  CRITICAL: "#f0563c",
  OFFLINE: "#5a6578",
};

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [servers, setServers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState("");

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
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="main-content">
        <div className="panel">
          <div className="panel-body empty-state">{error}</div>
        </div>
      </div>
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
    <div className="main-content">
      <div className="page-header">
        <div>
          <div className="page-title">Operations Overview</div>
          <div className="page-subtitle">Real-time fleet health across all registered infrastructure</div>
        </div>
        <div className="timestamp">Auto-refreshing every 15s</div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Servers" value={stats?.total_servers ?? "—"} />
        <KpiCard
          label="System Uptime"
          value={stats ? `${stats.uptime_percentage}%` : "—"}
          tone={stats && stats.uptime_percentage >= 99 ? "healthy" : "warning"}
        />
        <KpiCard
          label="Active Incidents"
          value={stats?.active_incidents ?? "—"}
          tone={stats?.active_incidents > 0 ? "critical" : "healthy"}
        />
        <KpiCard
          label="Critical Alerts (24h)"
          value={stats?.critical_alerts_last_24h ?? "—"}
          tone={stats?.critical_alerts_last_24h > 0 ? "warning" : "healthy"}
        />
      </div>

      <div className="panels-row">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Fleet Health Distribution</div>
          </div>
          <div className="panel-body" style={{ height: 220 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name.toUpperCase()]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#161d26", border: "1px solid #232b36" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No servers registered yet.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Recent Open Incidents</div>
          </div>
          {incidents.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td className="primary">{inc.title}</td>
                    <td>{inc.severity.replace("SEV", "SEV ").replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No open incidents. Fleet is stable.</div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Servers</div>
        </div>
        {servers.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Hostname</th>
                <th>Environment</th>
                <th>Provider / Region</th>
                <th>Status</th>
                <th>Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((s) => (
                <tr key={s.id}>
                  <td className="primary">{s.hostname}</td>
                  <td>{s.environment}</td>
                  <td>
                    {s.cloud_provider || "—"} / {s.region || "—"}
                  </td>
                  <td>
                    <StatusPill status={s.status} />
                  </td>
                  <td className="mono">
                    {s.last_heartbeat_at ? new Date(s.last_heartbeat_at).toLocaleString() : "never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            No servers registered. Install the monitoring agent and register a host to get started.
          </div>
        )}
      </div>
    </div>
  );
}
