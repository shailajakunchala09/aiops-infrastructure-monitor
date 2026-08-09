import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Gauge,
  AlertTriangle,
  ScrollText,
  Server,
  Power,
  Radio,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { section: "Operations" },
  { to: "/", label: "Overview", icon: Activity },
  { to: "/performance", label: "Performance", icon: Gauge },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/logs", label: "Log Analytics", icon: ScrollText },
  { section: "Infrastructure" },
  { to: "/servers", label: "Servers", icon: Server },
];

function SidebarContent({ onLogout, onNavigate }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2.5 px-3 pb-5 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-brand">
            <Radio size={14} className="text-white" strokeWidth={2.5} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-signal-healthy ring-2 ring-base-850 animate-pulse-dot" />
          </div>
          <div>
            <div className="font-mono text-[13px] font-bold tracking-wide text-slate-50 leading-none">
              AIOPS CONSOLE
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Enterprise Monitoring</div>
          </div>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) =>
          item.section ? (
            <div
              key={item.section}
              className="font-mono text-[10.5px] font-semibold tracking-widest uppercase text-slate-600 px-3 pt-4 pb-1.5"
            >
              {item.section}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ${
                  isActive
                    ? "text-slate-50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-500/15 to-brand-glow/5 border border-brand-400/20"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <item.icon
                    size={16}
                    strokeWidth={2}
                    className={`relative z-10 shrink-0 ${isActive ? "text-brand-400" : ""}`}
                  />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>

      <button
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-500 hover:text-signal-critical hover:bg-signal-critical-dim/40 transition-colors"
        onClick={() => {
          localStorage.removeItem("aiops_access_token");
          onLogout?.();
        }}
      >
        <Power size={16} strokeWidth={2} />
        Sign out
      </button>
    </>
  );
}

export default function Sidebar({ onLogout, mobileOpen = false, onCloseMobile }) {
  return (
    <>
      {/* Desktop: always-visible sticky rail */}
      <nav className="hidden md:flex w-64 shrink-0 flex-col h-screen sticky top-0 bg-base-850/80 backdrop-blur-xl border-r border-white/10 px-3 py-5">
        <SidebarContent onLogout={onLogout} />
      </nav>

      {/* Mobile: slide-over drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 flex flex-col bg-base-850 border-r border-white/10 px-3 py-5 z-50"
            >
              <SidebarContent onLogout={onLogout} onNavigate={onCloseMobile} />
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
