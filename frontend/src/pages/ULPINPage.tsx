import { useState } from "react";
import { api } from "../api/client";
import { Shield, CheckCircle, XCircle, Sparkles } from "lucide-react";

export function ULPINPage() {
  const [tab, setTab] = useState<"generate" | "validate">("generate");
  const [formData, setFormData] = useState({ plot_code: "", building_code: "", floor_code: "", unit_code: "", owner_name: "" });
  const [generated, setGenerated] = useState<Record<string, unknown> | null>(null);
  const [validateCode, setValidateCode] = useState("");
  const [validateResult, setValidateResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateULPIN(formData);
      setGenerated(res as Record<string, unknown>);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.validateULPIN(validateCode);
      setValidateResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ULPIN Management</h1>
        <p className="text-slate-400 mt-1">Generate and validate Unique Land Parcel Identification Numbers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("generate")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "generate" ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" : "text-slate-400 border border-transparent hover:bg-slate-800/50"}`}>
          <Sparkles size={14} className="inline mr-1" /> Generate
        </button>
        <button onClick={() => setTab("validate")}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "validate" ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" : "text-slate-400 border border-transparent hover:bg-slate-800/50"}`}>
          <Shield size={14} className="inline mr-1" /> Validate
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">{error}</div>
      )}

      {tab === "generate" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Generate New ULPIN</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="label">Plot Code *</label>
                <input className="input" placeholder="PRC-001" required
                  value={formData.plot_code}
                  onChange={(e) => setFormData({ ...formData, plot_code: e.target.value })} />
              </div>
              <div>
                <label className="label">Building Code</label>
                <input className="input" placeholder="BLD-001"
                  value={formData.building_code}
                  onChange={(e) => setFormData({ ...formData, building_code: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Floor Code</label>
                  <input className="input" placeholder="F01"
                    value={formData.floor_code}
                    onChange={(e) => setFormData({ ...formData, floor_code: e.target.value })} />
                </div>
                <div>
                  <label className="label">Unit Code</label>
                  <input className="input" placeholder="U01"
                    value={formData.unit_code}
                    onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Owner Name</label>
                <input className="input" placeholder="John Doe"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Generating..." : "Generate ULPIN"}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Generated ULPIN</h3>
            {generated ? (
              <div className="animate-fade-in space-y-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-400 mb-2">Your Property ID</p>
                  <p className="text-xl font-mono font-bold text-blue-300 break-all">{String(generated.ulpin_code)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Country</p>
                    <p className="font-medium">{String(generated.country_code)}</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">State</p>
                    <p className="font-medium">{String(generated.state_code)}</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">City</p>
                    <p className="font-medium">{String(generated.city_code)}</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 text-xs">Status</p>
                    <p className="font-medium text-amber-400">Pending</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-600">
                <Shield size={48} className="mx-auto mb-3 opacity-30" />
                <p>Fill the form and click Generate to create a new ULPIN.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "validate" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Validate ULPIN Code</h3>
            <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <label className="label">ULPIN Code</label>
                <input className="input font-mono" placeholder="IND-TG-HYD-PRC-001-BBLD-001-FF01-UU01"
                  value={validateCode}
                  onChange={(e) => setValidateCode(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Validating..." : "Validate Code"}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Validation Result</h3>
            {validateResult ? (
              <div className="animate-fade-in space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${validateResult.valid ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}>
                  {validateResult.valid ? <CheckCircle size={24} className="text-emerald-400" /> : <XCircle size={24} className="text-rose-400" />}
                  <div>
                    <p className={`font-semibold ${validateResult.valid ? "text-emerald-400" : "text-rose-400"}`}>
                      {validateResult.valid ? "Valid ULPIN" : "Invalid ULPIN"}
                    </p>
                    <p className="text-sm text-slate-400">{String(validateResult.error || "Format is correct")}</p>
                  </div>
                </div>

                {Boolean(validateResult.valid) && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Segments", String(validateResult.segments)],
                      ["Country", String(validateResult.country)],
                      ["State", String(validateResult.state)],
                      ["City", String(validateResult.city)],
                      ["Plot", String(validateResult.plot)],
                      ["Building", String(validateResult.building || "N/A")],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-800/40 rounded-xl p-3">
                        <p className="text-slate-500 text-xs">{label}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-600">
                <Shield size={48} className="mx-auto mb-3 opacity-30" />
                <p>Enter a ULPIN code and click Validate to check it.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}