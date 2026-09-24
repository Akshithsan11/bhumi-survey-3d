import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Globe, Building2, Layers, Zap, ArrowRight, Shield, Cpu, Eye } from "lucide-react";

export function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800/60 glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Globe size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Bhumi Survey <span className="gradient-text">3D</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/map" className="btn-ghost text-sm">
            <Eye size={16} className="inline mr-1" /> 3D Map
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary text-sm">
              Dashboard <ArrowRight size={16} className="inline ml-1" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Login</Link>
              <Link to="/signup" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20 mx-auto mb-6">
          <Sparkles size={14} className="mr-1" /> AI-Powered Property Intelligence
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
          See Every Property in <span className="gradient-text">3D</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10">
          From satellite photos to interactive 3D cities — AI detection,
          ULPIN generation, floor-level details, and underground infrastructure awareness.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/map" className="btn-primary text-lg px-8 py-4">
            Explore 3D Map <ArrowRight size={18} className="inline ml-2" />
          </Link>
          <Link to={isAuthenticated ? "/analysis" : "/login"} className="btn-ghost text-lg px-8 py-4">
            Try AI Detection
          </Link>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          No account needed — open the map as a guest and observe the city.
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Building2 size={28} className="text-blue-400" />,
              title: "Interactive 3D City",
              desc: "Rotate, zoom, and click any tower. Expand floors to see individual flats with owner status.",
            },
            {
              icon: <Cpu size={28} className="text-violet-400" />,
              title: "AI Building Detection",
              desc: "Upload any drone photo — real computer vision extracts footprints, heights, and building types.",
            },
            {
              icon: <Shield size={28} className="text-emerald-400" />,
              title: "ULPIN Generation",
              desc: "Generate official property IDs and validate records with a 0–100 quality score.",
            },
            {
              icon: <Layers size={28} className="text-amber-400" />,
              title: "Floor & Flat Explorer",
              desc: "Drill down from building to floor to flat — see area, occupancy, and rent details.",
            },
            {
              icon: <Zap size={28} className="text-rose-400" />,
              title: "Underground Conflict Check",
              desc: "Before any dig, see which water, power, and metro lines a foundation would hit.",
            },
            {
              icon: <Globe size={28} className="text-cyan-400" />,
              title: "Cloud Deployed",
              desc: "Runs on Vercel + Render with PostgreSQL — always online, accessible from any device.",
            },
          ].map((f, i) => (
            <div key={i} className="card animate-fade-in hover:border-blue-500/30 transition-all" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 text-center text-slate-500 text-sm">
        Bhumi Survey 3D — Giving every Indian property a digital twin, from rooftop to underground.
      </footer>
    </div>
  );
}

function Sparkles(props: { size: number; className?: string }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={props.className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}