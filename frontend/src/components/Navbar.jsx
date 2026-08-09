import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Search, Bell, ChevronDown } from "lucide-react";

const PAGE_TITLES = {
  "/": "Overview",
  "/performance": "Performance",
  "/incidents": "Incidents",
  "/logs": "Log Analytics",
  "/servers": "Servers",
};

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Navbar({ onOpenMobileMenu }) {
  const location = useLocation();
  const now = useClock();
  const pageTitle = PAGE_TITLES[location.pathname] || "AIOps Console";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-16 bg-base-900/70 backdrop-blur-xl border-b border-white/10">
      <button
        onClick={onOpenMobileMenu}
        className="md:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:bg-white/10"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold text-slate-100">{pageTitle}</span>
        <span className="hidden sm:block text-[11px] text-slate-500 font-mono">
          {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          {" · "}
          {now.toLocaleTimeString()}
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-2 ml-6 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search servers, incidents..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-[12.5px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-brand-400/40 focus:bg-white/[0.06] transition-colors"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-signal-healthy-dim border border-signal-healthy/20">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-healthy animate-pulse-dot" />
          <span className="text-[11px] font-mono font-medium text-signal-healthy">Live</span>
        </div>

        <button
          className="relative p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-signal-critical" />
        </button>

        <button className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg hover:bg-white/[0.06] transition-colors">
          <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-[11px] font-semibold text-white">
            AD
          </div>
          <span className="hidden md:block text-[12.5px] font-medium text-slate-300">Admin</span>
          <ChevronDown size={14} className="hidden md:block text-slate-500" />
        </button>
      </div>
    </header>
  );
}
