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
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkeletonPanel } from "@/components/ui/skeleton";
import { metricApi, serverApi } from "../services/api";

function Select({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none bg-white/[0.04] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-brand-400/50 transition-colors cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function ChartPanel({ title, data, dataKey, color, unit }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 200 }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="recorded_at"
                tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                stroke="#64748b"
                fontSize={11}
              />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit={unit} />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v) => new Date(v).toLocaleString()}
              />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-[13px] text-slate-600">
            No metric samples in this window.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Performance() {
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState("");
  const [metrics, setMetrics] = useState([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serverApi.list().then((res) => {
      setServers(res.data);
      if (res.data.length > 0) setSelectedServerId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedServerId) return;
    setLoading(true);
    metricApi.getForServer(selectedServerId, hours).then((res) => {
      setMetrics(res.data);
      setLoading(false);
    });
  }, [selectedServerId, hours]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-50 tracking-tight">Performance</h1>
        <p className="text-[13px] text-slate-500 mt-1">CPU, memory, and disk utilization trends per server</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={selectedServerId} onChange={(e) => setSelectedServerId(e.target.value)}>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.hostname}
              </option>
            ))}
          </Select>
          <Select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last 7 days</option>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-5">
          <SkeletonPanel height={200} />
          <SkeletonPanel height={200} />
          <SkeletonPanel height={200} />
        </div>
      ) : (
        <div className="space-y-5">
          <ChartPanel title="CPU Utilization" data={metrics} dataKey="cpu_percent" color="#818cf8" unit="%" />
          <ChartPanel title="Memory Usage" data={metrics} dataKey="memory_percent" color="#f6ad3c" unit="%" />
          <ChartPanel title="Disk Usage" data={metrics} dataKey="disk_percent" color="#22d3a8" unit="%" />
        </div>
      )}
    </div>
  );
}
