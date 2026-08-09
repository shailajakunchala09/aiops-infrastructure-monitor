import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Radio, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { authApi } from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@aiops.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem("aiops_access_token", response.data.access_token);
      onLogin?.(response.data.access_token);
      navigate("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-base-900 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 rounded-full bg-brand-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-brand-glow/10 blur-[120px]" />

      <motion.form
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        onSubmit={handleSubmit}
        className="glass-strong relative w-full max-w-[380px] rounded-2xl p-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-brand">
            <Radio size={17} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="font-mono text-[15px] font-bold tracking-wide text-slate-50">AIOPS CONSOLE</div>
        </div>
        <p className="text-[13px] text-slate-500 mt-2 mb-7">
          Sign in to view infrastructure health, incidents, and alerts.
        </p>

        <label htmlFor="email" className="block text-[12px] font-medium text-slate-400 mb-1.5">
          Email
        </label>
        <div className="relative mb-4">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-10 pr-3.5 py-2.5 text-[13.5px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-400/50 focus:bg-white/[0.06] transition-colors"
          />
        </div>

        <label htmlFor="password" className="block text-[12px] font-medium text-slate-400 mb-1.5">
          Password
        </label>
        <div className="relative mb-2">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-10 pr-3.5 py-2.5 text-[13.5px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-400/50 focus:bg-white/[0.06] transition-colors"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-1.5 text-signal-critical text-[12.5px] mt-2"
          >
            <AlertCircle size={13} />
            {error}
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-brand-gradient text-white font-semibold text-[13.5px] rounded-lg py-2.5 shadow-glow-brand disabled:opacity-60 transition-opacity"
        >
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <ArrowRight size={15} />}
        </motion.button>
      </motion.form>
    </div>
  );
}
