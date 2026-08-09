import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@aiops.local");
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
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="sidebar-brand" style={{ borderBottom: "none", marginBottom: 20, padding: 0 }}>
          <span className="mark" />
          <span className="name">AIOps Console</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 0, marginBottom: 20 }}>
          Sign in to view infrastructure health, incidents, and alerts.
        </p>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p style={{ color: "var(--signal-critical)", fontSize: 12.5, marginTop: -4 }}>{error}</p>
        )}
        <button className="btn primary" type="submit" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
