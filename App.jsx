import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Overview from "./pages/Overview.jsx";
import Performance from "./pages/Performance.jsx";
import Incidents from "./pages/Incidents.jsx";
import Logs from "./pages/Logs.jsx";
import Servers from "./pages/Servers.jsx";

const TOKEN_KEY = "aiops_access_token";

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  return { token, setToken };
}

function ProtectedLayout({ token, setToken, children }) {
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar onLogout={() => setToken(null)} />
      <main className="app-content">{children}</main>
    </div>
  );
}

export default function App() {
  const { token, setToken } = useAuth();

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login onLogin={(t) => setToken(t)} />}
        />
        <Route
          path="/"
          element={
            <ProtectedLayout token={token} setToken={setToken}>
              <Overview />
            </ProtectedLayout>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedLayout token={token} setToken={setToken}>
              <Performance />
            </ProtectedLayout>
          }
        />
        <Route
          path="/incidents"
          element={
            <ProtectedLayout token={token} setToken={setToken}>
              <Incidents />
            </ProtectedLayout>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedLayout token={token} setToken={setToken}>
              <Logs />
            </ProtectedLayout>
          }
        />
        <Route
          path="/servers"
          element={
            <ProtectedLayout token={token} setToken={setToken}>
              <Servers />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
