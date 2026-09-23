import { Link } from "react-router-dom";
import {
  Rocket, Camera, Map as MapIcon, Shield, Zap, Layers,
  ArrowRight, Sparkles, Building2, Eye,
} from "lucide-react";

const MODULES = [
  {
    to: "/map",
    title: "3D City Explorer",
    desc: "True height-based 3D blocks, orbit, explode floors, night/day, underground utilities.",
    icon: MapIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    tag: "New",
  },
  {
    to: "/analysis",
    title: "AI Photo Detection",
    desc: "Upload drone photos. CV pipeline estimates footprints, floors, heights, confidence.",
    icon: Camera,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    tag: "AI",
  },
  {
    to: "/ulpin",
    title: "ULPIN Studio",
    desc: "Generate unique land parcel IDs and validate them with segment breakdown.",
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    tag: "Gov",
  },
  {
    to: "/validation",
    title: "Compliance Scoring",
    desc: "0–100 quality score with passed/failed rule breakdown per building.",
    icon: Layers,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    tag: "QA",
  },
  {
    to: "/infrastructure",
    title: "Dig Conflict Check",
    desc: "Foundation depth vs buried water, power, sewer, metro lines before construction.",
    icon: Zap,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    tag: "Safety",
  },
  {
    to: "/settings",
    title: "Account & Security",
    desc: "Profile overview and password change with live strength meter.",
    icon: Eye,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    tag: "Auth",
  },
];

const PIPELINE = [
  { step: "1", label: "Capture", detail: "Drone / satellite imagery" },
  { step: "2", label: "Detect", detail: "AI building extraction" },
  { step: "3", label: "Survey", detail: "Floors, units, ownership" },
  { step: "4", label: "Identify", detail: "ULPIN generation" },
  { step: "5", label: "Validate", detail: "Rules + conflict checks" },
  { step: "6", label: "Twin", detail: "Live 3D digital twin" },
];

export function Prototypes() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
          <Sparkles size={14} className="mr-1" /> Interactive Prototypes
        </div>
        <h1 className="text-3xl font-bold">Module Gallery</h1>
        <p className="text-slate-400 mt-1">Jump into any live prototype module</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {MODULES.map((m, i) => (
          <Link
            key={m.to}
            to={m.to}
            className="card group hover:border-blue-500/30 transition-all animate-fade-in"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center`}>
                <m.icon size={22} className={m.color} />
              </div>
              <span className="badge bg-slate-700/50 text-slate-300 text-[10px]">{m.tag}</span>
            </div>
            <h3 className="font-semibold mb-2 group-hover:text-blue-300 transition-colors">
              {m.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{m.desc}</p>
            <span className="inline-flex items-center gap-1 text-xs text-blue-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Open module <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Rocket size={18} className="text-blue-400" /> Survey Pipeline
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE.map((s) => (
            <div key={s.step} className="relative bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                {s.step}
              </div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-[11px] text-slate-500 mt-1">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: "Live on Vercel", value: "frontend-pied-nine-61.vercel.app" },
          { icon: Shield, label: "API on Render", value: "bhumi-survey-3d-api.onrender.com" },
          { icon: Sparkles, label: "Stack", value: "React · FastAPI · PostgreSQL" },
        ].map((c) => (
          <div key={c.label} className="card flex items-center gap-3 py-4">
            <c.icon size={20} className="text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="text-sm font-medium truncate">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
