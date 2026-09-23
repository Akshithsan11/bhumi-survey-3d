import { useState, useMemo } from "react";
import {
  Layers, Building2, Home, Eye, EyeOff, RotateCcw,
  Sun, Moon, Grid3x3, Ruler,
} from "lucide-react";

type CityBuilding = {
  id: number;
  code: string;
  x: number;
  z: number;
  w: number;
  d: number;
  floors: number;
  type: string;
  color: string;
  heightM: number;
  confidence: number;
};

const CITY: CityBuilding[] = [
  { id: 1, code: "BLD-001", x: -28, z: -22, w: 36, d: 36, floors: 12, type: "Residential", color: "#3b82f6", heightM: 42, confidence: 94 },
  { id: 2, code: "BLD-002", x: -8, z: -34, w: 42, d: 32, floors: 8, type: "Residential", color: "#22c55e", heightM: 28, confidence: 89 },
  { id: 3, code: "BLD-003", x: 18, z: -18, w: 48, d: 40, floors: 18, type: "Commercial", color: "#a78bfa", heightM: 64, confidence: 96 },
  { id: 4, code: "BLD-004", x: 42, z: -30, w: 30, d: 34, floors: 6, type: "Residential", color: "#f59e0b", heightM: 21, confidence: 87 },
  { id: 5, code: "BLD-005", x: -36, z: 8, w: 44, d: 38, floors: 10, type: "Mixed", color: "#ef4444", heightM: 35, confidence: 91 },
  { id: 6, code: "BLD-006", x: -4, z: 14, w: 52, d: 46, floors: 22, type: "Commercial", color: "#06b6d4", heightM: 78, confidence: 97 },
  { id: 7, code: "BLD-007", x: 30, z: 18, w: 34, d: 30, floors: 5, type: "Residential", color: "#8b5cf6", heightM: 17, confidence: 85 },
  { id: 8, code: "BLD-008", x: -32, z: 36, w: 40, d: 36, floors: 14, type: "Mixed", color: "#ec4899", heightM: 49, confidence: 93 },
  { id: 9, code: "BLD-009", x: 12, z: 42, w: 28, d: 28, floors: 4, type: "Residential", color: "#14b8a6", heightM: 14, confidence: 82 },
  { id: 10, code: "BLD-010", x: 48, z: 36, w: 46, d: 42, floors: 16, type: "Commercial", color: "#f97316", heightM: 56, confidence: 95 },
  { id: 11, code: "BLD-011", x: -50, z: -40, w: 32, d: 50, floors: 9, type: "Residential", color: "#6366f1", heightM: 32, confidence: 88 },
  { id: 12, code: "BLD-012", x: 55, z: -50, w: 38, d: 34, floors: 11, type: "Mixed", color: "#eab308", heightM: 38, confidence: 90 },
];

const UNDERGROUND = [
  { type: "Water Pipeline", depth: 3.5, color: "#3b82f6" },
  { type: "Power Cable", depth: 2.8, color: "#f59e0b" },
  { type: "Sewer Line", depth: 4.2, color: "#64748b" },
  { type: "Metro Tunnel", depth: 15.0, color: "#a78bfa" },
];

const FLOOR_PX = 7;
const GRID = 160;

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (n & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

function BuildingBlock({
  b,
  selected,
  explode,
  night,
  onSelect,
}: {
  b: CityBuilding;
  selected: boolean;
  explode: number;
  night: boolean;
  onSelect: () => void;
}) {
  const height = b.floors * FLOOR_PX + explode * b.floors * 4;
  const top = shade(b.color, night ? -20 : 30);
  const front = b.color;
  const side = shade(b.color, night ? -55 : -45);
  const windows = Math.min(b.floors, 14);

  return (
    <div
      className="absolute cursor-pointer"
      onClick={onSelect}
      style={{
        left: `${GRID + b.x}px`,
        top: `${GRID + b.z}px`,
        width: `${b.w}px`,
        height: `${b.d}px`,
        transformStyle: "preserve-3d",
        transform: `translateZ(${height}px)`,
        transition: "transform 0.35s ease, opacity 0.25s",
        opacity: selected ? 1 : 0.92,
        zIndex: Math.round(height),
      }}
      title={`${b.code} · ${b.floors}F · ${b.heightM}m`}
    >
      {/* Top face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${top}, ${shade(b.color, night ? -10 : 10)})`,
          border: selected ? "2px solid #fff" : "1px solid rgba(255,255,255,0.25)",
          borderRadius: "3px",
          boxShadow: selected ? `0 0 28px ${b.color}` : `0 8px 24px rgba(0,0,0,0.35)`,
          transform: "translateZ(0.5px)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-mono font-bold text-white/85 drop-shadow">
            {b.code}
          </span>
        </div>
        {/* Roof detail */}
        <div
          className="absolute rounded-sm"
          style={{
            left: "30%",
            top: "30%",
            width: "40%",
            height: "40%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        />
      </div>

      {/* Front face (south) — height based on floors */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: `${b.w}px`,
          height: `${height}px`,
          background: `linear-gradient(180deg, ${front}, ${shade(b.color, night ? -70 : -55)})`,
          transformOrigin: "bottom center",
          transform: `rotateX(-90deg)`,
          border: selected ? "1px solid rgba(255,255,255,0.7)" : "1px solid rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Windows grid */}
        <div
          className="absolute inset-1 grid gap-[2px]"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: `repeat(${windows}, 1fr)`,
          }}
        >
          {Array.from({ length: windows * 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: night
                  ? i % 3 === 0
                    ? "rgba(255,230,120,0.75)"
                    : "rgba(150,200,255,0.15)"
                  : "rgba(200,230,255,0.35)",
                borderRadius: "1px",
              }}
            />
          ))}
        </div>
      </div>

      {/* Side face (east) */}
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: `${b.d}px`,
          height: `${height}px`,
          background: `linear-gradient(180deg, ${side}, ${shade(b.color, night ? -85 : -70)})`,
          transformOrigin: "right center",
          transform: `rotateY(90deg)`,
          border: "1px solid rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        <div
          className="absolute inset-1 grid gap-[2px]"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: `repeat(${Math.min(b.floors, 12)}, 1fr)`,
          }}
        >
          {Array.from({ length: Math.min(b.floors, 12) * 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: night
                  ? i % 4 === 0
                    ? "rgba(255,220,100,0.6)"
                    : "rgba(120,180,255,0.12)"
                  : "rgba(180,210,255,0.28)",
                borderRadius: "1px",
              }}
            />
          ))}
        </div>
      </div>

      {/* Left face (west) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: `${b.d}px`,
          height: `${height}px`,
          background: shade(b.color, night ? -90 : -75),
          transformOrigin: "left center",
          transform: `rotateY(-90deg)`,
          border: "1px solid rgba(0,0,0,0.35)",
        }}
      />

      {/* Back face (north) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${b.w}px`,
          height: `${height}px`,
          background: shade(b.color, night ? -80 : -65),
          transformOrigin: "top center",
          transform: `rotateX(90deg)`,
          border: "1px solid rgba(0,0,0,0.3)",
        }}
      />

      {/* Selected ring on ground projection */}
      {selected && (
        <div
          style={{
            position: "absolute",
            inset: -6,
            border: "2px dashed rgba(255,255,255,0.5)",
            borderRadius: "6px",
            transform: `translateZ(${-height + 1}px)`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export function Map3D() {
  const [selected, setSelected] = useState<number | null>(null);
  const [explode, setExplode] = useState(0);
  const [showUnderground, setShowUnderground] = useState(false);
  const [rotate, setRotate] = useState(35);
  const [night, setNight] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const building = selected ? CITY.find((b) => b.id === selected) : null;

  const filtered = useMemo(
    () => (typeFilter === "all" ? CITY : CITY.filter((b) => b.type === typeFilter)),
    [typeFilter]
  );

  const maxFloors = Math.max(...CITY.map((b) => b.floors));
  const avgConf = (CITY.reduce((s, b) => s + b.confidence, 0) / CITY.length).toFixed(1);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">3D City Map</h1>
          <p className="text-slate-400 mt-1">
            True 3D blocks scaled by height · {CITY.length} buildings · avg AI {avgConf}%
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowUnderground(!showUnderground)}
            className={`btn-sm text-sm ${showUnderground ? "btn-primary" : "btn-ghost"}`}
          >
            {showUnderground ? <EyeOff size={14} className="inline mr-1" /> : <Eye size={14} className="inline mr-1" />}
            Underground
          </button>
          <button
            onClick={() => setNight(!night)}
            className={`btn-sm text-sm ${night ? "btn-primary" : "btn-ghost"}`}
          >
            {night ? <Moon size={14} className="inline mr-1" /> : <Sun size={14} className="inline mr-1" />}
            {night ? "Night" : "Day"}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`btn-sm text-sm ${showGrid ? "btn-primary" : "btn-ghost"}`}
          >
            <Grid3x3 size={14} className="inline mr-1" /> Grid
          </button>
          <button
            onClick={() => setShowRuler(!showRuler)}
            className={`btn-sm text-sm ${showRuler ? "btn-primary" : "btn-ghost"}`}
          >
            <Ruler size={14} className="inline mr-1" /> Scale
          </button>
          <button
            onClick={() => {
              setRotate(35);
              setSelected(null);
              setExplode(0);
              setTypeFilter("all");
            }}
            className="btn-ghost text-sm"
          >
            <RotateCcw size={14} className="inline mr-1" /> Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden relative" style={{ minHeight: "560px" }}>
          <div
            className="absolute inset-0"
            style={{
              background: night
                ? "radial-gradient(ellipse at 50% 40%, #0f172a 0%, #020617 70%)"
                : "radial-gradient(ellipse at 50% 40%, #1e3a5f 0%, #0f172a 70%)",
            }}
          />

          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: "1100px", perspectiveOrigin: "50% 40%" }}
          >
            <div
              style={{
                transform: `rotateX(52deg) rotateZ(${rotate}deg)`,
                transformStyle: "preserve-3d",
                transition: "transform 0.45s ease",
                width: `${GRID * 2}px`,
                height: `${GRID * 2}px`,
                position: "relative",
              }}
            >
              {/* Ground plane */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: night
                    ? "linear-gradient(145deg, #0f172a, #1e293b)"
                    : "linear-gradient(145deg, #1e293b, #334155)",
                  border: "1px solid rgba(148,163,184,0.25)",
                  borderRadius: "8px",
                  transform: "translateZ(0px)",
                  boxShadow: "0 0 60px rgba(0,0,0,0.5)",
                }}
              />

              {/* Grid overlay */}
              {showGrid && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: night
                      ? "linear-gradient(rgba(59,130,246,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.12) 1px, transparent 1px)"
                      : "linear-gradient(rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.2) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                    borderRadius: "8px",
                    transform: "translateZ(0.5px)",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Roads */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "48%",
                  height: "14px",
                  background: night ? "#1e293b" : "#475569",
                  transform: "translateZ(1px)",
                  opacity: 0.85,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: "52%",
                  width: "14px",
                  background: night ? "#1e293b" : "#475569",
                  transform: "translateZ(1px)",
                  opacity: 0.85,
                }}
              />

              {/* Buildings — true 3D boxes */}
              {filtered.map((b) => (
                <BuildingBlock
                  key={b.id}
                  b={b}
                  selected={selected === b.id}
                  explode={explode}
                  night={night}
                  onSelect={() => setSelected(selected === b.id ? null : b.id)}
                />
              ))}

              {/* Height scale ruler */}
              {showRuler && (
                <div
                  style={{
                    position: "absolute",
                    left: -36,
                    top: 20,
                    width: 24,
                    height: `${maxFloors * FLOOR_PX + 40}px`,
                    transform: "rotateX(-90deg)",
                    transformOrigin: "top left",
                    borderLeft: "2px solid rgba(56,189,248,0.7)",
                    pointerEvents: "none",
                  }}
                >
                  {Array.from({ length: Math.ceil(maxFloors / 4) + 1 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: `${i * 4 * FLOOR_PX}px`,
                        left: 0,
                        width: "10px",
                        height: "1px",
                        background: "rgba(56,189,248,0.7)",
                      }}
                    />
                  ))}
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 12,
                      color: "#38bdf8",
                      fontSize: "9px",
                      fontFamily: "monospace",
                    }}
                  >
                    {maxFloors * 3.5}m
                  </span>
                </div>
              )}

              {/* Underground utilities */}
              {showUnderground && (
                <div style={{ position: "absolute", inset: 0, transform: "translateZ(-30px)" }}>
                  {UNDERGROUND.map((u, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: i % 2 === 0 ? "5%" : "40%",
                        top: `${15 + i * 18}%`,
                        width: i % 2 === 0 ? "90%" : "55%",
                        height: "8px",
                        background: u.color,
                        opacity: 0.7,
                        borderRadius: "4px",
                        boxShadow: `0 0 12px ${u.color}`,
                        transform: `translateZ(-${u.depth * 4}px)`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3">
            <div className="bg-black/50 backdrop-blur rounded-xl p-3 border border-slate-700/50">
              <label className="text-xs text-slate-300 mb-1 block">
                Orbit: {rotate}°
              </label>
              <input
                type="range"
                min={0}
                max={360}
                value={rotate}
                onChange={(e) => setRotate(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="bg-black/50 backdrop-blur rounded-xl p-3 border border-slate-700/50">
              <label className="text-xs text-slate-300 mb-1 block">
                Explode floors: {explode.toFixed(1)}×
              </label>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={explode}
                onChange={(e) => setExplode(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

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

          {showRuler && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur rounded-lg px-3 py-2 z-10">
              <p className="text-[10px] text-sky-400 font-mono">
                1 floor ≈ {FLOOR_PX}px · max {maxFloors}F
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400">
                <Building2 size={14} className="inline mr-1" /> Buildings ({filtered.length})
              </h3>
              <select
                className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-300"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All types</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {filtered.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelected(selected === b.id ? null : b.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selected === b.id
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-400 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ background: b.color }}
                  />
                  {b.code} — {b.type} ({b.floors}F · {b.heightM}m)
                </button>
              ))}
            </div>
          </div>

          {building && (
            <div className="card animate-slide-in">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${building.color}25` }}
                >
                  <Building2 size={20} style={{ color: building.color }} />
                </div>
                <div>
                  <p className="font-semibold">{building.code}</p>
                  <p className="text-sm text-slate-400">{building.type}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Height</span>
                  <span>{building.heightM}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Floors</span>
                  <span>{building.floors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Footprint</span>
                  <span>
                    {building.w}×{building.d}px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AI confidence</span>
                  <span className="text-emerald-400">{building.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="text-emerald-400">Active</span>
                </div>
              </div>

              {/* 3D height bar */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  <Ruler size={12} className="inline mr-1" /> Height relative to city max
                </p>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(building.floors / maxFloors) * 100}%`,
                      background: `linear-gradient(90deg, ${building.color}, ${shade(building.color, 40)})`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {building.floors}/{maxFloors} floors of city max
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  <Layers size={12} className="inline mr-1" /> Floor Breakdown
                </p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {Array.from({ length: Math.min(building.floors, 10) }, (_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs px-2 py-1 bg-slate-800/30 rounded"
                    >
                      <span>Floor {building.floors - i}</span>
                      <span className="text-slate-500">{3 + (i % 3)} units</span>
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
