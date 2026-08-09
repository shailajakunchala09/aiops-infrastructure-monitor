import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import { KpiCard, SeverityBadge } from "../components/Kpi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkeletonKpiCard, SkeletonPanel, SkeletonTable } from "@/components/ui/skeleton";
import { incidentApi } from "../services/api";

const STATUS_OPTIONS = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function Select({ value, onChange, className = "", children }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-[12.5px] text-slate-200 focus:outline-none focus:border-brand-400/50 transition-colors cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [incidentsRes, statsRes, trendsRes] = await Promise.all([
      incidentApi.list(filter ? { status: filter } : {}),
      incidentApi.stats(),
      incidentApi.monthlyTrends(6),
    ]);
    setIncidents(incidentsRes.data);
    setStats(statsRes.data);
    setTrends(trendsRes.data);
    setLoading(false);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-50 tracking-tight">Incident Management</h1>
        <p className="text-[13px] text-slate-500 mt-1">Track, assign, and resolve operational incidents</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonKpiCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard index={0} label="Open Incidents" value={stats?.total_open ?? "—"} tone="warning" />
          <KpiCard index={1} label="Resolved" value={stats?.total_resolved ?? "—"} tone="healthy" />
          <KpiCard index={2} label="Critical (SEV1)" value={stats?.total_critical ?? "—"} tone="critical" />
          <KpiCard
            index={3}
            label="Avg Resolution Time"
            value={stats?.avg_resolution_minutes != null ? `${stats.avg_resolution_minutes} min` : "—"}
          />
        </div>
      )}

      {loading ? (
        <SkeletonPanel height={200} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Incident Trend</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 200 }}>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="incident_count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[13px] text-slate-600">
                No incident history yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Incidents</CardTitle>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </CardHeader>
          {incidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-white/10">
                    <th className="px-5 py-2.5 font-semibold">Title</th>
                    <th className="px-5 py-2.5 font-semibold">Severity</th>
                    <th className="px-5 py-2.5 font-semibold">Source</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold">Opened</th>
                    <th className="px-5 py-2.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3 text-slate-200 max-w-xs truncate">{inc.title}</td>
                      <td className="px-5 py-3">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500 text-[12px]">{inc.source}</td>
                      <td className="px-5 py-3 text-slate-400">{inc.status}</td>
                      <td className="px-5 py-3 font-mono text-slate-500 text-[12px]">
                        {new Date(inc.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <Select value={inc.status} onChange={(e) => updateStatus(inc.id, e.target.value)}>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent className="text-center text-[13px] text-slate-600 py-10">
              No incidents match this filter.
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
