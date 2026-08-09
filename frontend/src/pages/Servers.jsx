import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, KeyRound, CheckCircle2 } from "lucide-react";
import { StatusPill } from "../components/Kpi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkeletonTable } from "@/components/ui/skeleton";
import { serverApi } from "../services/api";

const inputClass =
  "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-slate-100 mt-1.5 focus:outline-none focus:border-brand-400/50 focus:bg-white/[0.06] transition-colors";

export default function Servers() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
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
    serverApi.list().then((res) => {
      setServers(res.data);
      setLoading(false);
    });
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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-50 tracking-tight">Registered Servers</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Manage monitored infrastructure and per-server alert thresholds
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-brand-gradient text-white text-[13px] font-semibold rounded-lg px-4 py-2 shadow-glow-brand"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Register Server"}
        </motion.button>
      </div>

      <AnimatePresence>
        {newKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-signal-healthy/30">
              <CardContent>
                <div className="flex items-center gap-2 text-signal-healthy font-semibold text-[13.5px] mb-2">
                  <CheckCircle2 size={16} />
                  Server registered successfully
                </div>
                <p className="text-[12.5px] text-slate-500 mb-3">
                  Copy this API key now — it will not be shown again. Set it as{" "}
                  <span className="font-mono text-slate-400">AIOPS_API_KEY</span> on the monitoring agent for this
                  host.
                </p>
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5">
                  <KeyRound size={14} className="shrink-0 text-slate-500" />
                  <span className="font-mono text-[12.5px] text-slate-300 break-all">{newKey}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <form onSubmit={handleRegister} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-slate-400">Hostname</label>
                  <input
                    required
                    value={form.hostname}
                    onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[12px] text-slate-400">IP Address</label>
                  <input
                    required
                    value={form.ip_address}
                    onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[12px] text-slate-400">Environment</label>
                  <select
                    value={form.environment}
                    onChange={(e) => setForm({ ...form, environment: e.target.value })}
                    className={inputClass}
                  >
                    <option value="PRODUCTION">Production</option>
                    <option value="STAGING">Staging</option>
                    <option value="DEVELOPMENT">Development</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-slate-400">Cloud Provider</label>
                  <input
                    value={form.cloud_provider}
                    onChange={(e) => setForm({ ...form, cloud_provider: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  className="sm:col-span-2 bg-brand-gradient text-white text-[13.5px] font-semibold rounded-lg py-2.5 shadow-glow-brand"
                >
                  Register
                </button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-white/10">
                  <th className="px-5 py-2.5 font-semibold">Hostname</th>
                  <th className="px-5 py-2.5 font-semibold">IP Address</th>
                  <th className="px-5 py-2.5 font-semibold">Environment</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 font-semibold">CPU / MEM / DISK Thresholds</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-200">{s.hostname}</td>
                    <td className="px-5 py-3 font-mono text-slate-500">{s.ip_address}</td>
                    <td className="px-5 py-3 text-slate-400">{s.environment}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-500 text-[12px]">
                      {s.cpu_threshold}% / {s.memory_threshold}% / {s.disk_threshold}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
