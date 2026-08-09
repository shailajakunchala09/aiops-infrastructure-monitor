export function KpiCard({ label, value, tone, delta }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value${tone ? ` ${tone}` : ""}`}>{value}</div>
      {delta && <div className="kpi-delta">{delta}</div>}
    </div>
  );
}

const STATUS_LABELS = {
  HEALTHY: "healthy",
  WARNING: "warning",
  CRITICAL: "critical",
  OFFLINE: "offline",
  UNKNOWN: "offline",
};

export function StatusPill({ status }) {
  const tone = STATUS_LABELS[status] || "offline";
  return <span className={`status-pill ${tone}`}>{status}</span>;
}

export function SeverityBadge({ severity }) {
  return <span className={`severity-badge ${severity}`}>{severity.replace("SEV", "SEV ").replace("_", " ")}</span>;
}
