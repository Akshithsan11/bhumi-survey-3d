import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Zap, AlertTriangle, CheckCircle, Shield } from "lucide-react";

export function Infrastructure() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [conflictResult, setConflictResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depth, setDepth] = useState(3.0);
  const [buildings, setBuildings] = useState<Array<Record<string, unknown>>>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.getInfrastructure(), api.getBuildings()])
      .then(([i, b]) => { setItems(i); setBuildings(b); })
      .catch(console.error);
  }, []);

  const checkConflicts = async () => {
    if (!selectedBuilding) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.conflictCheck(selectedBuilding, depth);
      setConflictResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  };

  const conflicts = (conflictResult?.conflicts as Array<Record<string, unknown>>) || [];
  const safe = conflictResult?.safe_to_dig as boolean;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Underground Infrastructure</h1>
        <p className="text-slate-400 mt-1">View buried assets and check dig conflicts before construction</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conflict checker */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            <Shield size={18} className="inline mr-2 text-amber-400" /> Conflict Checker
          </h3>

          <div className="space-y-4">
            <div>
              <label className="label">Building</label>
              <select className="input" value={selectedBuilding || ""}
                onChange={(e) => setSelectedBuilding(Number(e.target.value))}>
                <option value="">Select a building...</option>
                {buildings.map((b) => (
                  <option key={String(b.id)} value={Number(b.id)}>{String(b.code)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Foundation Depth: {depth.toFixed(1)}m</label>
              <input type="range" min={1} max={20} step={0.5} value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-full" />
            </div>

            <button onClick={checkConflicts} disabled={!selectedBuilding || loading}
              className="btn-primary w-full">
              {loading ? "Checking..." : "Check for Conflicts"}
            </button>

            {error && <p className="text-rose-400 text-sm">{error}</p>}
          </div>

          {conflictResult && (
            <div className="mt-6 animate-fade-in">
              <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${
                safe ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
              }`}>
                {safe ? <CheckCircle size={24} className="text-emerald-400" /> : <AlertTriangle size={24} className="text-rose-400" />}
                <div>
                  <p className={`font-semibold ${safe ? "text-emerald-400" : "text-rose-400"}`}>
                    {safe ? "Safe to Dig" : `${conflicts.length} Conflict${conflicts.length > 1 ? "s" : ""} Found`}
                  </p>
                  <p className="text-sm text-slate-400">Foundation depth: {depth}m</p>
                </div>
              </div>

              {conflicts.length > 0 && (
                <div className="space-y-2">
                  {conflicts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-slate-800/40 rounded-xl">
                      <div>
                        <p className="text-sm font-medium">{String(c.name)}</p>
                        <p className="text-xs text-slate-500">{String(c.type)} at {String(c.depth_m)}m — {String(c.owner)}</p>
                      </div>
                      <span className={`badge ${c.severity === "high" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {String(c.severity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Infrastructure list */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            <Zap size={18} className="inline mr-2 text-blue-400" /> Underground Assets
          </h3>

          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Zap size={48} className="mx-auto mb-3 opacity-30" />
              <p>No infrastructure data loaded yet.</p>
              <p className="text-sm mt-1">Assets appear after seed data loads.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={String(item.id)} className="flex items-center justify-between px-4 py-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/60 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: String(item.type) === "water" ? "#3b82f620" :
                                    String(item.type) === "power" ? "#f59e0b20" :
                                    String(item.type) === "sewage" ? "#64748b20" : "#a78bfa20"
                      }}>
                      <Zap size={14} style={{
                        color: String(item.type) === "water" ? "#3b82f6" :
                               String(item.type) === "power" ? "#f59e0b" :
                               String(item.type) === "sewage" ? "#64748b" : "#a78bfa"
                      }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{String(item.name)}</p>
                      <p className="text-xs text-slate-500">{String(item.type)} · {String(item.depth_m)}m deep</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{String(item.owner_authority)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}