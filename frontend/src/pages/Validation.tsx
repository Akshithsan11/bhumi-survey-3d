import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Layers, CheckCircle, XCircle, Play, Lock } from "lucide-react";

export function Validation() {
  const { isAuthenticated } = useAuth();
  const [buildings, setBuildings] = useState<Array<Record<string, unknown>>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getBuildings().then(setBuildings).catch(console.error);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Validation</h1>
          <p className="text-slate-400 mt-1">Run quality checks on building records with a 0–100 score</p>
        </div>
        <div className="card text-center py-16">
          <Lock size={48} className="mx-auto mb-4 text-amber-400 opacity-60" />
          <h3 className="text-xl font-semibold mb-2">Sign in to run validation</h3>
          <p className="text-slate-400 mb-6">Validation is a write action and requires an account.</p>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="btn-primary">Sign In</Link>
            <Link to="/map" className="btn-ghost">Explore 3D Map</Link>
          </div>
        </div>
      </div>
    );
  }

  const runValidation = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.runValidation(selectedId);
      setResult(res as Record<string, unknown>);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  const failed = (result?.failed_rules as string[]) || [];
  const score = (result?.overall_score as number) || 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Validation</h1>
        <p className="text-slate-400 mt-1">Run quality checks on building records with a 0–100 score</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            <Layers size={18} className="inline mr-2 text-violet-400" /> Select Building
          </h3>

          {buildings.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No buildings available yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {buildings.map((b) => (
                <button key={String(b.id)} onClick={() => { setSelectedId(Number(b.id)); setResult(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                    selectedId === Number(b.id)
                      ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                      : "text-slate-400 hover:bg-slate-800/50 border border-transparent"
                  }`}>
                  <span className="font-medium">{String(b.code)}</span>
                  <span className="ml-2 text-slate-500">{String(b.building_type)}</span>
                </button>
              ))}
            </div>
          )}

          <button onClick={runValidation} disabled={!selectedId || loading} className="btn-primary w-full">
            {loading ? "Validating..." : <><Play size={16} className="inline mr-2" />Run Validation</>}
          </button>

          {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Validation Result</h3>

          {!result ? (
            <div className="text-center py-12 text-slate-600">
              <Layers size={48} className="mx-auto mb-3 opacity-30" />
              <p>Select a building and click Run Validation.</p>
            </div>
          ) : (
            <div className="animate-fade-in space-y-4">
              {/* Score circle */}
              <div className="flex items-center justify-center">
                <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center ${
                  score >= 80 ? "border-emerald-500" : score >= 50 ? "border-amber-500" : "border-rose-500"
                }`}>
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                      {score}
                    </p>
                    <p className="text-xs text-slate-500">/ 100</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-400">{String(result.passed_rules)}</p>
                  <p className="text-slate-400 text-xs">Passed</p>
                </div>
                <div className="bg-rose-500/10 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-rose-400">{failed.length}</p>
                  <p className="text-slate-400 text-xs">Failed</p>
                </div>
              </div>

              {failed.length > 0 && (
                <div className="space-y-2">
                  {failed.map((rule) => (
                    <div key={rule} className="flex items-center gap-2 text-sm px-3 py-2 bg-rose-500/10 rounded-lg">
                      <XCircle size={14} className="text-rose-400" />
                      <span className="text-rose-300">{rule}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-emerald-400 justify-center pt-2">
                <CheckCircle size={14} /> {String(result.validation_type)} validation complete
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}