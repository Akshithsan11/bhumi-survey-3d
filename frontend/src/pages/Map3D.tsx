import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import CityScene, { infraColor } from "../components/3d/CityScene";
import BuilderScene from "../components/3d/BuilderScene";
import { PlotBuilderPanel } from "../components/PlotBuilderPanel";
import {
  Layers, Eye, EyeOff, RotateCcw, Shield, Lock,
  Building2, MapPin, Sparkles, Grid3x3, Satellite, PencilRuler, AlertTriangle,
} from "lucide-react";

type MapMode = "city" | "plot";
type Selection = { kind: "building" | "infra"; id: number } | null;

export function Map3D() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<MapMode>("city");
  const [buildings, setBuildings] = useState<Array<Record<string, unknown>>>([]);
  const [parcels, setParcels] = useState<Array<Record<string, unknown>>>([]);
  const [infra, setInfra] = useState<Array<Record<string, unknown>>>([]);
  const [ulpins, setUlpins] = useState<Array<Record<string, unknown>>>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [showInfra, setShowInfra] = useState(true);
  const [exploded, setExploded] = useState(0);
  const [basemap, setBasemap] = useState<"grid" | "satellite">("grid");
  const [satelliteUrl, setSatelliteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Record<string, unknown> | null>(null);
  const [conflictBusy, setConflictBusy] = useState(false);

  const loadData = useCallback(() => {
    return Promise.all([
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
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load map data"));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      await loadData();
      if (alive) setLoading(false);
    })();
    api
      .latestAnalysisImage()
      .then((r) => {
        if (alive && r.image_url) setSatelliteUrl(api.analysisImageUrl(r.image_id!));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [loadData]);

  const selectedBuilding = useMemo(() => {
    if (selection?.kind !== "building") return null;
    return buildings.find((b) => Number(b.id) === selection.id) || null;
  }, [buildings, selection]);

  const selectedInfra = useMemo(() => {
    if (selection?.kind !== "infra") return null;
    return infra.find((i) => Number(i.id) === selection.id) || null;
  }, [infra, selection]);

  const selectedUlpins = useMemo(() => {
    if (!selectedBuilding) return [];
    const code = String(selectedBuilding.code || "");
    return ulpins.filter(
      (u) =>
        String(u.building_code || "") === code ||
        Number(u.property_id) === Number(selectedBuilding.id)
    );
  }, [selectedBuilding, ulpins]);

  const sceneBuildings = useMemo(
    () =>
      buildings.map((b) => ({
        id: Number(b.id),
        code: String(b.code || ""),
        parcel_id: b.parcel_id == null ? null : Number(b.parcel_id),
        height_m: b.height_m as string | undefined,
        total_floors: b.total_floors == null ? null : Number(b.total_floors),
        area_sqm: (b.area_sqm as string) || undefined,
        building_type: (b.building_type as string) || undefined,
        ai_confidence: b.ai_confidence as string | undefined,
        ulpin_code:
          (ulpins.find(
            (u) =>
              String(u.building_code || "") === String(b.code || "") ||
              Number(u.property_id) === Number(b.id)
          )?.ulpin_code as string) || undefined,
      })),
    [buildings, ulpins]
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
        length_m: i.length_m as string | undefined,
        owner_authority: (i.owner_authority as string) || undefined,
        status: (i.status as string) || undefined,
        building_id: i.building_id == null ? null : Number(i.building_id),
      })),
    [infra]
  );

  const handleSelectBuilding = useCallback((id: number) => {
    setSelection(id === -1 ? null : { kind: "building", id });
    setConflict(null);
  }, []);

  const handleSelectInfra = useCallback((id: number) => {
    setSelection(id === -1 ? null : { kind: "infra", id });
    setConflict(null);
  }, []);

  async function runConflictCheck() {
    if (!selectedInfra?.building_id) return;
    setConflictBusy(true);
    setConflict(null);
    try {
      const depth = Number(selectedInfra.depth_m) || 3;
      const res = await api.conflictCheck(Number(selectedInfra.building_id), depth);
      setConflict(res as Record<string, unknown>);
    } catch (err) {
      setConflict({ error: err instanceof Error ? err.message : "Check failed" });
    } finally {
      setConflictBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCity = mode === "city";

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold">3D Maps</h1>
          <p className="text-slate-400 mt-1">
            {isCity
              ? "Professional demo city — click buildings or underground pipes for details"
              : "Builder plot — create ULPIN + floors + size and watch it rise in 3D"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-xl border border-slate-700/70 bg-slate-900/70 p-1 gap-1">
            <button
              onClick={() => {
                setMode("city");
                setSelection(null);
                setConflict(null);
              }}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition ${
                isCity ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Professional 3D city"
            >
              <Building2 size={15} /> City
            </button>
            <button
              onClick={() => {
                setMode("plot");
                setSelection(null);
                setConflict(null);
              }}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition ${
                !isCity ? "bg-violet-500/20 text-violet-200 border border-violet-400/40" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Create ULPIN plot in 3D"
            >
              <PencilRuler size={15} /> My Plot
            </button>
          </div>
        </div>
      </div>

      {isCity && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setShowInfra(!showInfra)} className="btn-ghost text-sm !py-2" title="Toggle underground infrastructure">
            {showInfra ? <Eye size={16} className="inline mr-1" /> : <EyeOff size={16} className="inline mr-1" />}
            Underground
          </button>
          <button
            onClick={() => setBasemap(basemap === "grid" ? "satellite" : "grid")}
            className="btn-ghost text-sm !py-2"
            title="Switch basemap"
          >
            {basemap === "satellite" ? <Satellite size={16} className="inline mr-1" /> : <Grid3x3 size={16} className="inline mr-1" />}
            {basemap === "satellite" ? "Satellite" : "Grid"}
          </button>
          <button onClick={() => setExploded(exploded > 0.05 ? 0 : 1)} className="btn-ghost text-sm !py-2" title="Explode floors">
            <Layers size={16} className="inline mr-1" />
            {exploded > 0.05 ? "Collapse" : "Explode"}
          </button>
          <button
            onClick={() => {
              setSelection(null);
              setConflict(null);
              setExploded(0);
              setShowInfra(true);
              setBasemap("grid");
            }}
            className="btn-ghost text-sm !py-2"
            title="Reset view"
          >
            <RotateCcw size={16} className="inline mr-1" /> Reset
          </button>
          {basemap === "satellite" && !satelliteUrl && (
            <Link to="/analysis" className="btn-ghost text-sm !py-2 text-amber-300">
              Upload aerial photo →
            </Link>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm">
          <Lock size={16} className="text-amber-400 shrink-0" />
          <span className="text-amber-200">
            Guest observation mode — explore freely. Sign in to create plots, generate ULPINs, or run conflict checks.
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

      {isCity ? (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <CityScene
            buildings={sceneBuildings}
            parcels={sceneParcels}
            infra={sceneInfra}
            selectedId={selection?.kind === "building" ? selection.id : null}
            selectedInfraId={selection?.kind === "infra" ? selection.id : null}
            onSelect={handleSelectBuilding}
            onSelectInfra={handleSelectInfra}
            showInfra={showInfra}
            exploded={exploded}
            basemap={basemap}
            satelliteUrl={satelliteUrl}
            height={560}
          />

          <div className="space-y-4">
            {selectedInfra ? (
              <div className="card">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ background: infraColor(String(selectedInfra.type)) }}
                  />
                  Pipeline details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-slate-900/60 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Name</p>
                    <p className="font-semibold text-cyan-300">
                      {String(selectedInfra.name || selectedInfra.type)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Type</p>
                      <p className="font-medium capitalize">{String(selectedInfra.type)}</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Depth</p>
                      <p className="font-medium">{String(selectedInfra.depth_m ?? "?")} m</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Length</p>
                      <p className="font-medium">{String(selectedInfra.length_m ?? "?")} m</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Status</p>
                      <p className="font-medium capitalize">{String(selectedInfra.status || "active")}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 flex items-center gap-2">
                    <MapPin size={14} className="text-violet-400 shrink-0" />
                    <span className="text-slate-400">
                      Owner: {String(selectedInfra.owner_authority || "—")}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">Linked building</p>
                    {selectedInfra.building_id ? (
                      <button
                        type="button"
                        onClick={() => handleSelectBuilding(Number(selectedInfra.building_id))}
                        className="font-mono text-blue-300 hover:underline text-xs"
                      >
                        {String(
                          buildings.find((b) => Number(b.id) === Number(selectedInfra.building_id))?.code ||
                            `#${selectedInfra.building_id}`
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </div>

                  {selectedInfra.building_id ? (
                    isAuthenticated ? (
                      <button
                        onClick={runConflictCheck}
                        disabled={conflictBusy}
                        className="btn-primary w-full !py-2 text-xs inline-flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle size={14} />
                        {conflictBusy ? "Checking…" : "Run conflict check"}
                      </button>
                    ) : (
                      <Link to="/login" className="btn-primary w-full !py-2 text-xs text-center block">
                        Sign in to run conflict check
                      </Link>
                    )
                  ) : null}

                  {conflict && (
                    <div
                      className={`p-3 rounded-xl text-xs border ${
                        conflict.error
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                          : Number(conflict.total_conflicts) > 0
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {conflict.error
                        ? String(conflict.error)
                        : Number(conflict.total_conflicts) > 0
                          ? `${String(conflict.total_conflicts)} conflict(s) — not safe to dig`
                          : "Safe to dig at this depth"}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building2 size={18} className="text-blue-400" /> Selection
                </h3>
                {selectedBuilding ? (
                  <div className="space-y-3 text-sm">
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-slate-500 text-xs">Code</p>
                      <p className="font-mono font-semibold text-blue-300">{String(selectedBuilding.code)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/60 rounded-xl p-3">
                        <p className="text-slate-500 text-xs">Height</p>
                        <p className="font-medium">{String(selectedBuilding.height_m ?? "?")} m</p>
                      </div>
                      <div className="bg-slate-900/60 rounded-xl p-3">
                        <p className="text-slate-500 text-xs">Floors</p>
                        <p className="font-medium">{String(selectedBuilding.total_floors ?? "?")}</p>
                      </div>
                      <div className="bg-slate-900/60 rounded-xl p-3">
                        <p className="text-slate-500 text-xs">Type</p>
                        <p className="font-medium capitalize">{String(selectedBuilding.building_type || "—")}</p>
                      </div>
                      <div className="bg-slate-900/60 rounded-xl p-3">
                        <p className="text-slate-500 text-xs">AI Confidence</p>
                        <p className="font-medium text-emerald-400">{String(selectedBuilding.ai_confidence ?? "?")}%</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 flex items-center gap-2">
                      <MapPin size={14} className="text-violet-400" />
                      <span className="text-slate-400">
                        Parcel:{" "}
                        {String(
                          parcels.find((p) => Number(p.id) === Number(selectedBuilding.parcel_id))?.code || "—"
                        )}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3 flex items-center gap-2">
                      <PencilRuler size={14} className="text-cyan-400" />
                      <span className="text-slate-400">
                        Area: {String(selectedBuilding.area_sqm || "—")} m²
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm py-6 text-center">
                    Click a building — or an underground pipe — to inspect it.
                  </p>
                )}
              </div>
            )}

            {!selectedInfra && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield size={18} className="text-cyan-400" /> ULPIN
                </h3>
                {selectedBuilding ? (
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
            )}

            <div className="card text-xs text-slate-500 space-y-1">
              <p><span className="text-cyan-400">●</span> Orbit: drag · Zoom: scroll · Pan: right-drag</p>
              <p><span className="text-rose-400">◆</span> Click building or pipe = select · empty = deselect</p>
              <p><span className="text-amber-400">■</span> Underground pipes: hover to preview, click for details</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div>
            <BuilderScene
              buildings={sceneBuildings}
              selectedId={selection?.kind === "building" ? selection.id : null}
              onSelect={handleSelectBuilding}
              height={520}
            />
            <p className="text-xs text-slate-500 mt-2">
              Drag to orbit · click a building for its ULPIN · create more from the panel →
            </p>
          </div>
          <PlotBuilderPanel
            buildings={buildings}
            ulpins={ulpins}
            selectedId={selection?.kind === "building" ? selection.id : null}
            onSelect={handleSelectBuilding}
            onChanged={loadData}
          />
        </div>
      )}
    </div>
  );
}
