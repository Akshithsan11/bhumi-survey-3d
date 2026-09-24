import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Upload, Cpu, Building2, CheckCircle, AlertTriangle, Lock } from "lucide-react";

interface Detection {
  id: number;
  type: string;
  estimated_height_m: number;
  estimated_floors: number;
  confidence: number;
}

export function Analysis() {
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Building Detection</h1>
          <p className="text-slate-400 mt-1">Upload a drone/satellite photo — real computer vision extracts buildings</p>
        </div>
        <div className="card text-center py-16">
          <Lock size={48} className="mx-auto mb-4 text-amber-400 opacity-60" />
          <h3 className="text-xl font-semibold mb-2">Sign in to upload photos</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Photo upload and AI detection require an account. Guests can still explore the 3D map and ULPIN history.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/login" className="btn-primary">Sign In</Link>
            <Link to="/map" className="btn-ghost">Explore 3D Map</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzePhoto(file);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const buildings = (result?.buildings as Detection[]) || [];
  const total = (result?.total_detected as number) || 0;
  const avgConf = buildings.length
    ? (buildings.reduce((s, b) => s + b.confidence, 0) / buildings.length).toFixed(1)
    : "0";

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Building Detection</h1>
        <p className="text-slate-400 mt-1">Upload a drone/satellite photo — real computer vision extracts buildings</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload area */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            <Upload size={18} className="inline mr-2 text-blue-400" /> Upload Photo
          </h3>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-all"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Upload size={28} className="text-blue-400" />
                </div>
                <p className="text-slate-300 font-medium">Drop image here or click to browse</p>
                <p className="text-slate-500 text-sm mt-1">JPG, PNG up to 10MB</p>
              </>
            )}
          </div>

          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

          <button onClick={analyze} disabled={!file || loading} className="btn-primary w-full mt-4">
            {loading ? (
              <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Analyzing...</>
            ) : (
              <><Cpu size={16} className="inline mr-2" />Run AI Detection</>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
              <AlertTriangle size={14} className="inline mr-1" /> {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            <CheckCircle size={18} className="inline mr-2 text-emerald-400" /> Detection Results
          </h3>

          {!result ? (
            <div className="text-center py-12 text-slate-600">
              <Building2 size={48} className="mx-auto mb-3 opacity-30" />
              <p>No analysis yet. Upload a photo and click Analyze.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-500/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{total}</p>
                  <p className="text-xs text-slate-400">Buildings</p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{avgConf}%</p>
                  <p className="text-xs text-slate-400">Avg Confidence</p>
                </div>
                <div className="bg-violet-500/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-violet-400">{buildings.length}</p>
                  <p className="text-xs text-slate-400">Detected</p>
                </div>
              </div>

              {/* Building list */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {buildings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/40 rounded-xl">
                    <div>
                      <p className="font-medium text-sm">Building #{b.id}</p>
                      <p className="text-xs text-slate-500">{b.type} · {b.estimated_floors} floors · {b.estimated_height_m}m</p>
                    </div>
                    <span className="badge bg-emerald-500/10 text-emerald-400">{b.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}