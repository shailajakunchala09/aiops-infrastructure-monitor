import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { metricApi, serverApi } from "../services/api";

function ChartPanel({ title, data, dataKey, color, unit }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">{title}</div>
      </div>
      <div className="panel-body" style={{ height: 200 }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#232b36" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="recorded_at"
                tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                stroke="#5a6578"
                fontSize={11}
              />
              <YAxis stroke="#5a6578" fontSize={11} domain={[0, 100]} unit={unit} />
              <Tooltip
                contentStyle={{ background: "#161d26", border: "1px solid #232b36", fontSize: 12 }}
                labelFormatter={(v) => new Date(v).toLocaleString()}
              />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No metric samples in this window.</div>
        )}
      </div>
    </div>
  );
}

export default function Performance() {
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState("");
  const [metrics, setMetrics] = useState([]);
  const [hours, setHours] = useState(24);

  useEffect(() => {
    serverApi.list().then((res) => {
      setServers(res.data);
      if (res.data.length > 0) setSelectedServerId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedServerId) return;
    metricApi.getForServer(selectedServerId, hours).then((res) => setMetrics(res.data));
  }, [selectedServerId, hours]);

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <div className="page-title">Performance</div>
          <div className="page-subtitle">CPU, memory, and disk utilization trends per server</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(e.target.value)}
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-hairline-strong)",
              borderRadius: 4,
              padding: "8px 10px",
              fontSize: 13,
            }}
          >
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.hostname}
              </option>
            ))}
          </select>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-hairline-strong)",
              borderRadius: 4,
              padding: "8px 10px",
              fontSize: 13,
            }}
          >
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last 7 days</option>
          </select>
        </div>
      </div>

      <ChartPanel title="CPU Utilization" data={metrics} dataKey="cpu_percent" color="#4c8fe0" unit="%" />
      <ChartPanel title="Memory Usage" data={metrics} dataKey="memory_percent" color="#f0a83c" unit="%" />
      <ChartPanel title="Disk Usage" data={metrics} dataKey="disk_percent" color="#35d0a1" unit="%" />
    </div>
  );
}
