import { useState, useEffect } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Globe, LayoutDashboard, Map, Upload, Shield, Layers, Zap,
  LogOut, Menu, X, User, Settings as SettingsIcon, Rocket,
  Eye, Lock, Home,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/map", label: "3D Map", icon: Map, guest: true },
  { to: "/infrastructure", label: "Underground", icon: Zap, guest: true },
  { to: "/ulpin", label: "ULPIN", icon: Shield, guest: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, guest: false },
  { to: "/analysis", label: "AI Analysis", icon: Upload, guest: false },
  { to: "/validation", label: "Validation", icon: Layers, guest: false },
  { to: "/prototypes", label: "Prototypes", icon: Rocket, guest: true },
  { to: "/settings", label: "Settings", icon: SettingsIcon, guest: false },
];

export function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    const guestAllowed = ["/map", "/infrastructure", "/ulpin", "/prototypes"];
    const isGuestAllowed = guestAllowed.includes(path);
    if (!isAuthenticated && !isGuestAllowed) {
      navigate("/login", { replace: true, state: { from: path } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const visibleNav = isAuthenticated
    ? NAV_ITEMS
    : NAV_ITEMS.filter((n) => n.guest);

  const NavLinkItem = ({
    to,
    label,
    icon: Icon,
    onClick,
    guest,
  }: {
    to: string;
    label: string;
    icon: typeof Map;
    onClick?: () => void;
    guest?: boolean;
  }) => {
    if (!isAuthenticated && guest === false) {
      return (
        <NavLink
          key={to}
          to="/login"
          onClick={onClick}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-400 border border-transparent transition-all"
          title="Sign in required"
        >
          <Icon size={18} /> {label}
          <Lock size={12} className="ml-auto opacity-50" />
        </NavLink>
      );
    }
    return (
      <NavLink
        key={to}
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            isActive
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
          }`
        }
      >
        <Icon size={18} /> {label}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/60 glass fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-slate-800/60">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <span className="font-bold text-lg">Bhumi <span className="gradient-text">3D</span></span>
          </NavLink>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLinkItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                  <User size={16} />
                </div>
                <span className="text-sm text-slate-300 truncate">{user?.username || "User"}</span>
              </div>
              <button onClick={handleLogout} className="btn-ghost w-full text-sm justify-center">
                <LogOut size={16} className="inline mr-2" /> Logout
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 mb-2 text-xs text-amber-400">
                <Eye size={14} /> Guest observation mode
              </div>
              <NavLink to="/login" className="btn-primary w-full text-sm justify-center block text-center">
                Sign In
              </NavLink>
              <NavLink to="/" className="btn-ghost w-full text-sm justify-center block text-center">
                <Home size={14} className="inline mr-1" /> Home
              </NavLink>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 glass px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Globe size={16} />
          </div>
          <span className="font-bold">Bhumi 3D</span>
        </NavLink>
        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <NavLink to="/login" className="btn-primary text-xs !py-1.5 !px-3">
              Sign In
            </NavLink>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-slate-900 p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 mb-4">
              <span className="font-bold text-lg">Bhumi 3D</span>
            </div>
            {NAV_ITEMS.map((item) => (
              <NavLinkItem key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
            ))}
            <div className="mt-4 pt-4 border-t border-slate-800">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="btn-ghost w-full text-sm">
                  <LogOut size={16} className="inline mr-2" /> Logout
                </button>
              ) : (
                <NavLink to="/login" onClick={() => setSidebarOpen(false)} className="btn-primary w-full text-sm block text-center">
                  Sign In
                </NavLink>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto"><Outlet /></div>
      </main>
    </div>
  );
}
