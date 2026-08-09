import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";
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

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedLayout({ token, setToken, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-base-900">
      <Sidebar
        onLogout={() => setToken(null)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar onOpenMobileMenu={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1500px] w-full mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
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
