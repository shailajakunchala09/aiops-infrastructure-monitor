import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Search,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkeletonPanel, SkeletonTable } from "@/components/ui/skeleton";
import { logApi } from "../services/api";

const LEVEL_CONFIG = {
  INFO: {
    color: "#38bdf8",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    icon: FileText,
  },
  WARNING: {
    color: "#fbbf24",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    icon: AlertTriangle,
  },
  ERROR: {
    color: "#fb7185",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    icon: AlertCircle,
  },
  CRITICAL: {
    color: "#c084fc",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    icon: XCircle,
  },
};

const LEVEL_COLORS = {
  INFO: "#38bdf8",
  WARNING: "#fbbf24",
  ERROR: "#fb7185",
  CRITICAL: "#c084fc",
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [levelDist, setLevelDist] = useState([]);
  const [topErrors, setTopErrors] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    const [distRes, errRes] = await Promise.all([
      logApi.levelDistribution(24),
      logApi.topErrors(24),
    ]);

    setLevelDist(distRes.data);
    setTopErrors(errRes.data);
  }

  async function search() {
    const params = {
      hours: 24,
      limit: 100,
    };

    if (keyword) params.keyword = keyword;
    if (level) params.level = level;

    const res = await logApi.search(params);
    setLogs(res.data);
  }

  useEffect(() => {
    Promise.all([loadAnalytics(), search()]).finally(() => {
      setLoading(false);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = {
    INFO: levelDist.find((x) => x.level === "INFO")?.count || 0,
    WARNING: levelDist.find((x) => x.level === "WARNING")?.count || 0,
    ERROR: levelDist.find((x) => x.level === "ERROR")?.count || 0,
    CRITICAL: levelDist.find((x) => x.level === "CRITICAL")?.count || 0,
  };

  const totalLogs =
    counts.INFO + counts.WARNING + counts.ERROR + counts.CRITICAL;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400/10 border border-brand-400/20">
            <FileText size={20} className="text-brand-300" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-slate-50 tracking-tight">
              Log Analytics
            </h1>

            <p className="text-[13px] text-slate-500 mt-1">
              Search, categorize, and analyze application logs
            </p>
          </div>
        </div>
      </div>

      {/* Colorful summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            title="Total Logs"
            value={totalLogs}
            subtitle="Last 24 hours"
            icon={FileText}
            color="cyan"
          />

          <SummaryCard
            title="Info"
            value={counts.INFO}
            subtitle="Normal activity"
            icon={CheckCircle2}
            color="sky"
          />

          <SummaryCard
            title="Warnings"
            value={counts.WARNING}
            subtitle="Needs attention"
            icon={AlertTriangle}
            color="amber"
          />

          <SummaryCard
            title="Errors"
            value={counts.ERROR}
            subtitle="Failures detected"
            icon={AlertCircle}
            color="rose"
          />

          <SummaryCard
            title="Critical"
            value={counts.CRITICAL}
            subtitle="Immediate action"
            icon={XCircle}
            color="purple"
          />
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonPanel height={270} />
          <SkeletonPanel height={270} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Distribution */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Log Level Distribution</CardTitle>
                <p className="text-[11px] text-slate-500 mt-1">
                  Activity across the last 24 hours
                </p>
              </div>
            </CardHeader>

            <CardContent>
              {levelDist.length > 0 ? (
                <div className="grid grid-cols-[1fr_150px] items-center gap-3">
                  <div style={{ height: 230 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={levelDist}
                          dataKey="count"
                          nameKey="level"
                          innerRadius={58}
                          outerRadius={88}
                          paddingAngle={4}
                          stroke="none"
                        >
                          {levelDist.map((entry) => (
                            <Cell
                              key={entry.level}
                              fill={LEVEL_COLORS[entry.level]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 10,
                            color: "#fff",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {["INFO", "WARNING", "ERROR", "CRITICAL"].map((name) => {
                      const config = LEVEL_CONFIG[name];

                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: config.color }}
                            />

                            <span className="text-[12px] text-slate-400">
                              {name}
                            </span>
                          </div>

                          <span className="text-[12px] font-semibold text-slate-200">
                            {counts[name]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState text="No logs recorded yet." />
              )}
            </CardContent>
          </Card>

          {/* Top failing applications */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Top Failing Applications</CardTitle>
                <p className="text-[11px] text-slate-500 mt-1">
                  Applications generating ERROR / CRITICAL logs
                </p>
              </div>
            </CardHeader>

            <CardContent>
              {topErrors.length > 0 ? (
                <div style={{ height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topErrors}
                      layout="vertical"
                      margin={{ left: 10, right: 15 }}
                    >
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="3 3"
                        horizontal={false}
                      />

                      <XAxis
                        type="number"
                        stroke="#64748b"
                        fontSize={11}
                        allowDecimals={false}
                      />

                      <YAxis
                        type="category"
                        dataKey="source_application"
                        stroke="#94a3b8"
                        fontSize={11}
                        width={120}
                      />

                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          color: "#fff",
                          fontSize: 12,
                        }}
                      />

                      <Bar
                        dataKey="error_count"
                        fill="#fb7185"
                        radius={[0, 6, 6, 0]}
                        barSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="No errors recorded yet." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="flex-wrap gap-4">
            <div>
              <CardTitle>Log Search</CardTitle>
              <p className="text-[11px] text-slate-500 mt-1">
                Search the latest 24 hours of application activity
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  placeholder="Search message text..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  className="bg-white/[0.04] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-[12.5px] text-slate-200 placeholder:text-slate-600 w-56 focus:outline-none focus:border-brand-400/50 transition-colors"
                />
              </div>

              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="appearance-none bg-white/[0.04] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-[12.5px] text-slate-200 focus:outline-none focus:border-brand-400/50 transition-colors cursor-pointer"
                >
                  <option value="">All levels</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>

                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>

              <button
                onClick={search}
                className="bg-brand-gradient text-white text-[12.5px] font-semibold rounded-lg px-5 py-2 shadow-glow-brand hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>
          </CardHeader>

          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10 bg-white/[0.015]">
                    <th className="px-5 py-3 font-semibold">Time</th>
                    <th className="px-5 py-3 font-semibold">Application</th>
                    <th className="px-5 py-3 font-semibold">Level</th>
                    <th className="px-5 py-3 font-semibold">Message</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => {
                    const config =
                      LEVEL_CONFIG[log.level] || LEVEL_CONFIG.INFO;

                    const Icon = config.icon;

                    return (
                      <tr
                        key={log.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.035] transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-mono text-slate-200 text-[12px]">
                            {log.source_application}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bg} ${config.border}`}
                            style={{ color: config.color }}
                          >
                            <Icon size={12} />
                            <span className="font-semibold text-[10px] tracking-wide">
                              {log.level}
                            </span>
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-slate-400 max-w-xl">
                          <div className="truncate">{log.message}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent className="text-center text-[13px] text-slate-600 py-12">
              No log entries match this search.
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, color }) {
  const styles = {
    cyan: {
      text: "text-cyan-300",
      bg: "bg-cyan-400/10",
      border: "border-cyan-400/20",
    },
    sky: {
      text: "text-sky-300",
      bg: "bg-sky-400/10",
      border: "border-sky-400/20",
    },
    amber: {
      text: "text-amber-300",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
    },
    rose: {
      text: "text-rose-300",
      bg: "bg-rose-400/10",
      border: "border-rose-400/20",
    },
    purple: {
      text: "text-purple-300",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
    },
  };

  const style = styles[color];

  return (
    <div
      className={`rounded-xl border ${style.border} bg-slate-900/60 p-4 relative overflow-hidden`}
    >
      <div
        className={`absolute -right-5 -top-5 h-20 w-20 rounded-full ${style.bg} blur-2xl`}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 uppercase tracking-wide">
            {title}
          </span>

          <div
            className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center`}
          >
            <Icon size={15} className={style.text} />
          </div>
        </div>

        <div className={`text-2xl font-bold mt-3 ${style.text}`}>
          {value}
        </div>

        <div className="text-[10px] text-slate-600 mt-1">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center h-[230px] text-center">
      <FileText size={28} className="text-slate-700 mb-3" />
      <div className="text-[13px] text-slate-600">{text}</div>
    </div>
  );
}