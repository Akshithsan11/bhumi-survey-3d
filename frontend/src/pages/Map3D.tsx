import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import CityScene from "../components/3d/CityScene";
import {
  Layers, Eye, EyeOff, RotateCcw, Shield, Lock,
  Building2, MapPin, Sparkles,
} from "lucide-react";

export function Map3D() {
  const { isAuthenticated } = useAuth();
  const [buildings, setBuildings] = useState<Array<Record<string, unknown>>>([]);
  const [parcels, setParcels] = useState<Array<Record<string, unknown>>>([]);
  const [infra, setInfra] = useState<Array<Record<string, unknown>>>([]);
  const [ulpins, setUlpins] = useState<Array<Record<string, unknown>>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showInfra, setShowInfra] = useState(true);
  const [exploded, setExploded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getBuildings(),
      api.getParcels(),
      api.getInfrastructure(),
      api.getULPINs(),
    ])
      .then(([b, p, i, u]) => {
        setBuildings(b);
        setParcels(p);
        setInfra(i);
        setUlpins(u);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load map data"))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => buildings.find((b) => Number(b.id) === selectedId) || null,
    [buildings, selectedId]
  );

  const selectedUlpins = useMemo(() => {
    if (!selected) return [];
    const code = String(selected.code || "");
    return ulpins.filter(
      (u) =>
        String(u.building_code || "") === code ||
        Number(u.property_id) === Number(selected.id)
    );
  }, [selected, ulpins]);

  const sceneBuildings = useMemo(
    () =>
      buildings.map((b) => ({
        id: Number(b.id),
        code: String(b.code || ""),
        parcel_id: b.parcel_id == null ? null : Number(b.parcel_id),
        height_m: b.height_m as string | undefined,
        total_floors: b.total_floors == null ? null : Number(b.total_floors),
        building_type: (b.building_type as string) || undefined,
        ai_confidence: b.ai_confidence as string | undefined,
      })),
    [buildings]
  );

  const sceneParcels = useMemo(
    () =>
      parcels.map((p) => ({
        id: Number(p.id),
        code: String(p.code || ""),
        name: (p.name as string) || undefined,
      })),
    [parcels]
  );

  const sceneInfra = useMemo(
    () =>
      infra.map((i) => ({
        id: Number(i.id),
        type: String(i.type || "Utility"),
        name: (i.name as string) || undefined,
        depth_m: i.depth_m as string | undefined,
        building_id: i.building_id == null ? null : Number(i.building_id),
      })),
    [infra]
  );

  const handleSelect = (id: number) => {
    setSelectedId(id === -1 ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">3D City Map</h1>
          <p className="text-slate-400 mt-1">
            Orbit, click any building to inspect it and its ULPIN records
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowInfra(!showInfra)}
            className="btn-ghost text-sm !py-2"
            title="Toggle underground infrastructure"
          >
            {showInfra ? <Eye size={16} className="inline mr-1" /> : <EyeOff size={16} className="inline mr-1" />}
            Underground
          </button>
          <button
            onClick={() => setExploded(exploded > 0.05 ? 0 : 1)}
            className="btn-ghost text-sm !py-2"
            title="Explode floors"
          >
            <Layers size={16} className="inline mr-1" />
            {exploded > 0.05 ? "Collapse" : "Explode"}
          </button>
          <button
            onClick={() => {
              setSelectedId(null);
              setExploded(0);
              setShowInfra(true);
            }}
            className="btn-ghost text-sm !py-2"
            title="Reset view"
          >
            <RotateCcw size={16} className="inline mr-1" /> Reset
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm">
          <Lock size={16} className="text-amber-400 shrink-0" />
          <span className="text-amber-200">
            Guest observation mode — explore the city freely. Sign in to upload photos, generate ULPINs, or run validation.
          </span>
          <Link to="/login" className="btn-primary text-xs !py-2 !px-4 ml-auto">
            Sign In
          </Link>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <CityScene
          buildings={sceneBuildings}
          parcels={sceneParcels}
          infra={sceneInfra}
          selectedId={selectedId}
          onSelect={handleSelect}
          showInfra={showInfra}
          exploded={exploded}
          height={560}
        />

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-blue-400" /> Selection
            </h3>
            {selected ? (
              <div className="space-y-3 text-sm">
                <div className="bg-slate-900/60 rounded-xl p-3">
                  <p className="text-slate-500 text-xs">Code</p>
                  <p className="font-mono font-semibold text-blue-300">{String(selected.code)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/60 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Height</p>
                    <p className="font-medium">{String(selected.height_m ?? "?")} m</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Floors</p>
                    <p className="font-medium">{String(selected.total_floors ?? "?")}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Type</p>
                    <p className="font-medium capitalize">{String(selected.building_type || "—")}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">AI Confidence</p>
                    <p className="font-medium text-emerald-400">{String(selected.ai_confidence ?? "?")}%</p>
                  </div>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3 flex items-center gap-2">
                  <MapPin size={14} className="text-violet-400" />
                  <span className="text-slate-400">
                    Parcel:{" "}
                    {String(
                      parcels.find((p) => Number(p.id) === Number(selected.parcel_id))?.code || "—"
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-6 text-center">
                Click a building in the 3D scene to inspect it.
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield size={18} className="text-cyan-400" /> ULPIN
            </h3>
            {selected ? (
              selectedUlpins.length > 0 ? (
                <div className="space-y-2">
                  {selectedUlpins.map((u) => (
                    <div
                      key={String(u.id)}
                      className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-3"
                    >
                      <p className="font-mono text-xs text-cyan-300 break-all">{String(u.ulpin_code)}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Owner: {String(u.owner_name || "—")} ·{" "}
                        {String(u.validated) === "1" ? "Validated" : "Pending"}
                      </p>
                    </div>
                  ))}
                  <Link to="/ulpin" className="btn-ghost text-xs w-full !py-2 text-center block">
                    Open ULPIN Registry
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm mb-3">No ULPIN issued for this building yet.</p>
                  {isAuthenticated ? (
                    <Link to="/ulpin" className="btn-primary text-xs !py-2 w-full inline-flex items-center justify-center gap-1">
                      <Sparkles size={14} /> Generate ULPIN
                    </Link>
                  ) : (
                    <Link to="/login" className="btn-primary text-xs !py-2 w-full inline-flex items-center justify-center gap-1">
                      <Lock size={14} /> Sign in to generate
                    </Link>
                  )}
                </div>
              )
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">
                Select a building to view its ULPIN history.
              </p>
            )}
          </div>

          <div className="card text-xs text-slate-500 space-y-1">
            <p><span className="text-cyan-400">●</span> Orbit: drag · Zoom: scroll · Pan: right-drag</p>
            <p><span className="text-rose-400">◆</span> Click building = select · Click empty = deselect</p>
            <p><span className="text-amber-400">■</span> Underground pipes toggle with the Underground button</p>
          </div>
        </div>
      </div>
    </div>
  );
}
