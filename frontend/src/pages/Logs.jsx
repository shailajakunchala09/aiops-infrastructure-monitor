import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkeletonPanel, SkeletonTable } from "@/components/ui/skeleton";
import { logApi } from "../services/api";

const LEVEL_COLORS = { INFO: "#4fa2f0", WARNING: "#f6ad3c", ERROR: "#fb5a67", CRITICAL: "#c084fc" };

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [levelDist, setLevelDist] = useState([]);
  const [topErrors, setTopErrors] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    const [distRes, errRes] = await Promise.all([logApi.levelDistribution(24), logApi.topErrors(24)]);
    setLevelDist(distRes.data);
    setTopErrors(errRes.data);
  }

  async function search() {
    const params = { hours: 24, limit: 100 };
    if (keyword) params.keyword = keyword;
    if (level) params.level = level;
    const res = await logApi.search(params);
    setLogs(res.data);
  }

  useEffect(() => {
    Promise.all([loadAnalytics(), search()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-50 tracking-tight">Log Analytics</h1>
        <p className="text-[13px] text-slate-500 mt-1">Search, categorize, and analyze application logs</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SkeletonPanel height={200} />
          <SkeletonPanel height={200} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Log Level Distribution (24h)</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 200 }}>
              {levelDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={levelDist} dataKey="count" nameKey="level" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {levelDist.map((entry) => (
                        <Cell key={entry.level} fill={LEVEL_COLORS[entry.level]} />
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
                  No logs recorded yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Failing Applications</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 200 }}>
              {topErrors.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topErrors} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="source_application" stroke="#64748b" fontSize={11} width={120} />
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="error_count" fill="#fb5a67" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[13px] text-slate-600">
                  No errors recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : (
        <Card>
          <CardHeader className="flex-wrap">
            <CardTitle>Log Search</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  placeholder="Search message text..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  className="bg-white/[0.04] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] text-slate-200 placeholder:text-slate-600 w-52 focus:outline-none focus:border-brand-400/50 transition-colors"
                />
              </div>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="appearance-none bg-white/[0.04] border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-[12.5px] text-slate-200 focus:outline-none focus:border-brand-400/50 transition-colors cursor-pointer"
                >
                  <option value="">All levels</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
              <button
                onClick={search}
                className="bg-brand-gradient text-white text-[12.5px] font-semibold rounded-lg px-4 py-1.5 shadow-glow-brand"
              >
                Search
              </button>
            </div>
          </CardHeader>
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-white/10">
                    <th className="px-5 py-2.5 font-semibold">Time</th>
                    <th className="px-5 py-2.5 font-semibold">Application</th>
                    <th className="px-5 py-2.5 font-semibold">Level</th>
                    <th className="px-5 py-2.5 font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-500 text-[12px]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-200">{log.source_application}</td>
                      <td className="px-5 py-3 font-mono font-medium" style={{ color: LEVEL_COLORS[log.level] }}>
                        {log.level}
                      </td>
                      <td className="px-5 py-3 text-slate-400 max-w-md truncate">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent className="text-center text-[13px] text-slate-600 py-10">
              No log entries match this search.
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
