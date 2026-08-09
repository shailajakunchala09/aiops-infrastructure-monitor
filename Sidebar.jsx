import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { section: "Operations" },
  { to: "/", label: "Overview", icon: "◉" },
  { to: "/performance", label: "Performance", icon: "▤" },
  { to: "/incidents", label: "Incidents", icon: "▲" },
  { to: "/logs", label: "Log Analytics", icon: "≡" },
  { section: "Infrastructure" },
  { to: "/servers", label: "Servers", icon: "▦" },
];

export default function Sidebar({ onLogout }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="mark" />
        <span className="name">AIOps Console</span>
      </div>
      {NAV_ITEMS.map((item) =>
        item.section ? (
          <div className="nav-section-label" key={item.section}>
            {item.section}
          </div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="mono">{item.icon}</span>
            {item.label}
          </NavLink>
        )
      )}
      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        <button
          className="nav-item"
          style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
          onClick={() => {
            localStorage.removeItem("aiops_access_token");
            onLogout?.();
          }}
        >
          <span className="mono">⏻</span>
          Sign out
        </button>
      </div>
    </nav>
  );
}
