import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { logApi } from "../services/api";

const LEVEL_COLORS = { INFO: "#4c8fe0", WARNING: "#f0a83c", ERROR: "#f0563c", CRITICAL: "#a83cf0" };

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [levelDist, setLevelDist] = useState([]);
  const [topErrors, setTopErrors] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState("");

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
    loadAnalytics();
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <div className="page-title">Log Analytics</div>
          <div className="page-subtitle">Search, categorize, and analyze application logs</div>
        </div>
      </div>

      <div className="panels-row">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Log Level Distribution (24h)</div>
          </div>
          <div className="panel-body" style={{ height: 200 }}>
            {levelDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={levelDist} dataKey="count" nameKey="level" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {levelDist.map((entry) => (
                      <Cell key={entry.level} fill={LEVEL_COLORS[entry.level]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#161d26", border: "1px solid #232b36" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No logs recorded yet.</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Top Failing Applications</div>
          </div>
          <div className="panel-body" style={{ height: 200 }}>
            {topErrors.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topErrors} layout="vertical">
                  <CartesianGrid stroke="#232b36" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#5a6578" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="source_application" stroke="#5a6578" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ background: "#161d26", border: "1px solid #232b36", fontSize: 12 }} />
                  <Bar dataKey="error_count" fill="#f0563c" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No errors recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Log Search</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Search message text..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              style={{
                background: "var(--bg-inset)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-hairline-strong)",
                borderRadius: 4,
                padding: "6px 10px",
                fontSize: 12.5,
                width: 220,
              }}
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                background: "var(--bg-inset)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-hairline-strong)",
                borderRadius: 4,
                padding: "6px 10px",
                fontSize: 12.5,
              }}
            >
              <option value="">All levels</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <button className="btn primary" onClick={search}>
              Search
            </button>
          </div>
        </div>
        {logs.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Application</th>
                <th>Level</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="mono">{new Date(log.created_at).toLocaleTimeString()}</td>
                  <td className="primary">{log.source_application}</td>
                  <td style={{ color: LEVEL_COLORS[log.level] }}>{log.level}</td>
                  <td>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No log entries match this search.</div>
        )}
      </div>
    </div>
  );
}
