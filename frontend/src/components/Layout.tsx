import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Globe, LayoutDashboard, Map, Upload, Shield, Layers, Zap,
  LogOut, Menu, X, User,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "3D Map", icon: Map },
  { to: "/analysis", label: "AI Analysis", icon: Upload },
  { to: "/ulpin", label: "ULPIN", icon: Shield },
  { to: "/validation", label: "Validation", icon: Layers },
  { to: "/infrastructure", label: "Underground", icon: Zap },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
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
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              <User size={16} />
            </div>
            <span className="text-sm text-slate-300 truncate">{user?.username || "User"}</span>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full text-sm justify-center">
            <LogOut size={16} className="inline mr-2" /> Logout
          </button>
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
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-slate-900 p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 mb-4">
              <span className="font-bold text-lg">Bhumi 3D</span>
            </div>
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive ? "bg-blue-500/15 text-blue-400" : "text-slate-400"
                  }`
                }>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="btn-ghost w-full mt-4 text-sm">
              <LogOut size={16} className="inline mr-2" /> Logout
            </button>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}