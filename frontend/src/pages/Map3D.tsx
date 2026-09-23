import { useState } from "react";
import { Layers, Building2, Home, Eye, EyeOff, RotateCcw } from "lucide-react";

const DEMO_BUILDINGS = [
  { id: 1, code: "BLD-001", x: -15, z: -10, w: 4, h: 12, type: "Residential", floors: 12, color: "#3b82f6" },
  { id: 2, code: "BLD-002", x: -5, z: -15, w: 5, h: 8, type: "Residential", floors: 8, color: "#22c55e" },
  { id: 3, code: "BLD-003", x: 5, z: -8, w: 6, h: 15, type: "Commercial", floors: 15, color: "#a78bfa" },
  { id: 4, code: "BLD-004", x: 15, z: -12, w: 4, h: 10, type: "Residential", floors: 10, color: "#f59e0b" },
  { id: 5, code: "BLD-005", x: -10, z: 5, w: 5, h: 6, type: "Mixed", floors: 6, color: "#ef4444" },
  { id: 6, code: "BLD-006", x: 0, z: 8, w: 7, h: 18, type: "Commercial", floors: 18, color: "#06b6d4" },
  { id: 7, code: "BLD-007", x: 12, z: 5, w: 4, h: 9, type: "Residential", floors: 9, color: "#8b5cf6" },
  { id: 8, code: "BLD-008", x: -18, z: 8, w: 5, h: 7, type: "Mixed", floors: 7, color: "#ec4899" },
];

const UNDERGROUND = [
  { type: "Water Pipeline", depth: 3.5, color: "#3b82f6" },
  { type: "Power Cable", depth: 2.8, color: "#f59e0b" },
  { type: "Sewer Line", depth: 4.2, color: "#64748b" },
  { type: "Metro Tunnel", depth: 15.0, color: "#a78bfa" },
];

export function Map3D() {
  const [selected, setSelected] = useState<number | null>(null);
  const [explode, setExplode] = useState(0);
  const [showUnderground, setShowUnderground] = useState(false);
  const [rotate, setRotate] = useState(0);

  const building = selected ? DEMO_BUILDINGS.find((b) => b.id === selected) : null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">3D City Map</h1>
          <p className="text-slate-400 mt-1">Click any building to inspect</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUnderground(!showUnderground)}
            className={`btn-sm ${showUnderground ? "btn-primary" : "btn-ghost"} text-sm`}>
            {showUnderground ? <EyeOff size={14} className="inline mr-1" /> : <Eye size={14} className="inline mr-1" />}
            Underground
          </button>
          <button onClick={() => { setRotate(0); setSelected(null); setExplode(0); }}
            className="btn-ghost text-sm">
            <RotateCcw size={14} className="inline mr-1" /> Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 3D View */}
        <div className="lg:col-span-2 card p-0 overflow-hidden relative" style={{ minHeight: "500px" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/30" />

          {/* CSS 3D City Scene */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "800px" }}>
            <div style={{ transform: `rotateX(45deg) rotateZ(${rotate}deg)`, transformStyle: "preserve-3d", transition: "transform 0.5s" }}>
              {/* Ground */}
              <div className="w-80 h-80 bg-slate-800/40 border border-slate-700/50 rounded-lg" style={{ transform: "rotateX(90deg) translateZ(-2px)" }} />

              {/* Buildings */}
              {DEMO_BUILDINGS.map((b) => (
                <div key={b.id}
                  onClick={() => setSelected(b.id === selected ? null : b.id)}
                  className="absolute cursor-pointer transition-all duration-300"
                  style={{
                    left: `${b.x * 4 + 160}px`,
                    top: `${b.z * 4 + 160}px`,
                    width: `${b.w * 8}px`,
                    height: `${b.w * 8}px`,
                    background: b.color,
                    opacity: selected && selected !== b.id ? 0.4 : 0.9,
                    boxShadow: selected === b.id ? `0 0 20px ${b.color}` : `0 4px 15px ${b.color}40`,
                    transform: `translateZ(${b.h * 5 + explode * b.h * 3}px)`,
                    borderRadius: "4px",
                    border: selected === b.id ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/70 whitespace-nowrap">
                    {b.code}
                  </div>
                </div>
              ))}

              {/* Underground layer */}
              {showUnderground && (
                <div className="absolute left-0 top-0 w-80 h-80" style={{ transform: "translateZ(-40px)" }}>
                  {UNDERGROUND.map((u, i) => (
                    <div key={i}
                      className="absolute rounded-full"
                      style={{
                        left: `${10 + i * 20}%`, top: `${20 + i * 15}%`,
                        width: "80%", height: "6px",
                        background: u.color, opacity: 0.6,
                        transform: `translateZ(-${u.depth * 3}px)`,
                        borderRadius: "3px",
                      }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rotation control */}
          <input type="range" min={0} max={360} value={rotate}
            onChange={(e) => setRotate(Number(e.target.value))}
            className="absolute bottom-4 left-4 right-4 z-10" />

          {/* Explode control */}
          <div className="absolute bottom-14 left-4 right-4 z-10">
            <label className="text-xs text-slate-400 mb-1 block">Explode Floors: {explode.toFixed(1)}x</label>
            <input type="range" min={0} max={3} step={0.1} value={explode}
              onChange={(e) => setExplode(Number(e.target.value))}
              className="w-full" />
          </div>

          {/* Underground legend */}
          {showUnderground && (
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur rounded-xl p-3 z-10 space-y-1">
              <p className="text-xs font-semibold text-slate-300 mb-2">Underground</p>
              {UNDERGROUND.map((u, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-1 rounded" style={{ background: u.color }} />
                  <span className="text-slate-400">{u.type} ({u.depth}m)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Building list */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">
              <Building2 size={14} className="inline mr-1" /> Buildings ({DEMO_BUILDINGS.length})
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {DEMO_BUILDINGS.map((b) => (
                <button key={b.id} onClick={() => setSelected(selected === b.id ? null : b.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selected === b.id ? "bg-blue-500/20 text-blue-300" : "text-slate-400 hover:bg-slate-800/50"
                  }`}>
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: b.color }} />
                  {b.code} — {b.type} ({b.floors}F)
                </button>
              ))}
            </div>
          </div>

          {/* Selected building details */}
          {building && (
            <div className="card animate-slide-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${building.color}20` }}>
                  <Building2 size={20} style={{ color: building.color }} />
                </div>
                <div>
                  <p className="font-semibold">{building.code}</p>
                  <p className="text-sm text-slate-400">{building.type}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Height</span><span>{building.h * 3.5}m</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Floors</span><span>{building.floors}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="text-emerald-400">Active</span></div>
              </div>

              {/* Floor breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  <Layers size={12} className="inline mr-1" /> Floor Breakdown
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Array.from({ length: Math.min(building.floors, 8) }, (_, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2 py-1 bg-slate-800/30 rounded">
                      <span>Floor {building.floors - i}</span>
                      <span className="text-slate-500">{4} units</span>
                      <Home size={10} className="text-slate-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}