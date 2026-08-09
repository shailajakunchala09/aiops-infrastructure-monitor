import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard, SeverityBadge } from "../components/Kpi";
import { incidentApi } from "../services/api";

const STATUS_OPTIONS = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [filter, setFilter] = useState("");

  async function loadAll() {
    const [incidentsRes, statsRes, trendsRes] = await Promise.all([
      incidentApi.list(filter ? { status: filter } : {}),
      incidentApi.stats(),
      incidentApi.monthlyTrends(6),
    ]);
    setIncidents(incidentsRes.data);
    setStats(statsRes.data);
    setTrends(trendsRes.data);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id, status) {
    await incidentApi.update(id, { status });
    loadAll();
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <div className="page-title">Incident Management</div>
          <div className="page-subtitle">Track, assign, and resolve operational incidents</div>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Open Incidents" value={stats?.total_open ?? "—"} tone="warning" />
        <KpiCard label="Resolved" value={stats?.total_resolved ?? "—"} tone="healthy" />
        <KpiCard label="Critical (SEV1)" value={stats?.total_critical ?? "—"} tone="critical" />
        <KpiCard
          label="Avg Resolution Time"
          value={stats?.avg_resolution_minutes != null ? `${stats.avg_resolution_minutes} min` : "—"}
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Monthly Incident Trend</div>
        </div>
        <div className="panel-body" style={{ height: 200 }}>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid stroke="#232b36" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#5a6578" fontSize={11} />
                <YAxis stroke="#5a6578" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#161d26", border: "1px solid #232b36", fontSize: 12 }} />
                <Bar dataKey="incident_count" fill="#f0a83c" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No incident history yet.</div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">All Incidents</div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-hairline-strong)",
              borderRadius: 4,
              padding: "6px 10px",
              fontSize: 12.5,
            }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {incidents.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Severity</th>
                <th>Source</th>
                <th>Status</th>
                <th>Opened</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td className="primary">{inc.title}</td>
                  <td>
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="mono">{inc.source}</td>
                  <td>{inc.status}</td>
                  <td className="mono">{new Date(inc.created_at).toLocaleString()}</td>
                  <td>
                    <select
                      value={inc.status}
                      onChange={(e) => updateStatus(inc.id, e.target.value)}
                      style={{
                        background: "var(--bg-inset)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-hairline-strong)",
                        borderRadius: 4,
                        padding: "4px 8px",
                        fontSize: 12,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No incidents match this filter.</div>
        )}
      </div>
    </div>
  );
}
