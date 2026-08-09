import { useEffect, useState } from "react";
import { StatusPill } from "../components/Kpi";
import { serverApi } from "../services/api";

export default function Servers() {
  const [servers, setServers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [form, setForm] = useState({
    hostname: "",
    ip_address: "",
    environment: "PRODUCTION",
    cloud_provider: "AWS",
    region: "us-east-1",
  });

  function load() {
    serverApi.list().then((res) => setServers(res.data));
  }

  useEffect(load, []);

  async function handleRegister(e) {
    e.preventDefault();
    const res = await serverApi.register(form);
    setNewKey(res.data.api_key);
    setShowForm(false);
    load();
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <div className="page-title">Registered Servers</div>
          <div className="page-subtitle">Manage monitored infrastructure and per-server alert thresholds</div>
        </div>
        <button className="btn primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Register Server"}
        </button>
      </div>

      {newKey && (
        <div className="panel">
          <div className="panel-body">
            <div style={{ color: "var(--signal-healthy)", fontWeight: 600, marginBottom: 6 }}>
              Server registered successfully
            </div>
            <div className="page-subtitle" style={{ marginBottom: 10 }}>
              Copy this API key now — it will not be shown again. Set it as{" "}
              <span className="mono">AIOPS_API_KEY</span> on the monitoring agent for this host.
            </div>
            <div className="mono" style={{ background: "var(--bg-inset)", padding: 10, borderRadius: 4, wordBreak: "break-all" }}>
              {newKey}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="panel">
          <form className="panel-body" onSubmit={handleRegister} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Hostname</label>
              <input
                required
                value={form.hostname}
                onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>IP Address</label>
              <input
                required
                value={form.ip_address}
                onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Environment</label>
              <select
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                style={inputStyle}
              >
                <option value="PRODUCTION">Production</option>
                <option value="STAGING">Staging</option>
                <option value="DEVELOPMENT">Development</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Cloud Provider</label>
              <input
                value={form.cloud_provider}
                onChange={(e) => setForm({ ...form, cloud_provider: e.target.value })}
                style={inputStyle}
              />
            </div>
            <button className="btn primary" type="submit" style={{ gridColumn: "span 2" }}>
              Register
            </button>
          </form>
        </div>
      )}

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hostname</th>
              <th>IP Address</th>
              <th>Environment</th>
              <th>Status</th>
              <th>CPU / MEM / DISK Thresholds</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((s) => (
              <tr key={s.id}>
                <td className="primary">{s.hostname}</td>
                <td className="mono">{s.ip_address}</td>
                <td>{s.environment}</td>
                <td>
                  <StatusPill status={s.status} />
                </td>
                <td className="mono">
                  {s.cpu_threshold}% / {s.memory_threshold}% / {s.disk_threshold}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "var(--bg-inset)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-hairline-strong)",
  borderRadius: 4,
  padding: "8px 10px",
  fontSize: 13,
  marginTop: 4,
};
