import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Shield, CheckCircle, XCircle, Sparkles, History,
  Lock, Search, Filter,
} from "lucide-react";

type Tab = "generate" | "validate" | "history";

export function ULPINPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(isAuthenticated ? "generate" : "history");
  const [formData, setFormData] = useState({
    plot_code: "",
    building_code: "",
    floor_code: "",
    unit_code: "",
    owner_name: "",
  });
  const [generated, setGenerated] = useState<Record<string, unknown> | null>(null);
  const [validateCode, setValidateCode] = useState("");
  const [validateResult, setValidateResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [buildings, setBuildings] = useState<Array<Record<string, unknown>>>([]);

  const loadHistory = () => {
    setHistoryLoading(true);
    setHistoryError(null);
    Promise.all([api.getULPINs(), api.getBuildings()])
      .then(([u, b]) => {
        setHistory(u);
        setBuildings(b);
      })
      .catch((err) =>
        setHistoryError(err instanceof Error ? err.message : "Failed to load ULPIN history")
      )
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateULPIN(formData);
      setGenerated(res as Record<string, unknown>);
      loadHistory();
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

  const filteredHistory = history.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(u.ulpin_code || "").toLowerCase().includes(q) ||
      String(u.plot_code || "").toLowerCase().includes(q) ||
      String(u.owner_name || "").toLowerCase().includes(q) ||
      String(u.building_code || "").toLowerCase().includes(q);
    const matchesBuilding =
      !buildingFilter || String(u.building_code || "") === buildingFilter;
    return matchesSearch && matchesBuilding;
  });

  const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "validate", label: "Validate", icon: Shield },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ULPIN Management</h1>
        <p className="text-slate-400 mt-1">
          Generate, validate, and browse the full ULPIN registry history
        </p>
      </div>

      {!isAuthenticated && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm">
          <Lock size={16} className="text-amber-400 shrink-0" />
          <span className="text-amber-200">
            Guest mode — you can browse history and validate codes. Sign in to generate new ULPINs.
          </span>
          <Link to="/login" className="btn-primary text-xs !py-2 !px-4 ml-auto">
            Sign In
          </Link>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === id
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                : "text-slate-400 border border-transparent hover:bg-slate-800/50"
            }`}
          >
            <Icon size={14} className="inline mr-1" /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {tab === "generate" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Generate New ULPIN</h3>
            {!isAuthenticated ? (
              <div className="text-center py-10">
                <Lock size={40} className="mx-auto mb-3 text-amber-400 opacity-60" />
                <p className="text-slate-400 mb-4">Sign in to generate official ULPIN records.</p>
                <Link to="/login" className="btn-primary inline-flex">
                  Sign In to Continue
                </Link>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="label">Plot Code *</label>
                  <input
                    className="input"
                    placeholder="PRC-001"
                    required
                    value={formData.plot_code}
                    onChange={(e) => setFormData({ ...formData, plot_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Building Code</label>
                  <input
                    className="input"
                    placeholder="BLD-001"
                    value={formData.building_code}
                    onChange={(e) => setFormData({ ...formData, building_code: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Floor Code</label>
                    <input
                      className="input"
                      placeholder="F01"
                      value={formData.floor_code}
                      onChange={(e) => setFormData({ ...formData, floor_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Unit Code</label>
                    <input
                      className="input"
                      placeholder="U01"
                      value={formData.unit_code}
                      onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Owner Name</label>
                  <input
                    className="input"
                    placeholder="John Doe"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "Generating..." : "Generate ULPIN"}
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Generated ULPIN</h3>
            {generated ? (
              <div className="animate-fade-in space-y-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-400 mb-2">Your Property ID</p>
                  <p className="text-xl font-mono font-bold text-blue-300 break-all">
                    {String(generated.ulpin_code)}
                  </p>
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
                <button
                  onClick={() => {
                    setTab("history");
                    loadHistory();
                  }}
                  className="btn-ghost w-full text-sm"
                >
                  View in History
                </button>
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
                <input
                  className="input font-mono"
                  placeholder="IND-TG-HYD-PRC-001-BBLD-001-FF01-UU01"
                  value={validateCode}
                  onChange={(e) => setValidateCode(e.target.value)}
                  required
                />
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
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl ${
                    validateResult.valid
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-rose-500/10 border border-rose-500/20"
                  }`}
                >
                  {validateResult.valid ? (
                    <CheckCircle size={24} className="text-emerald-400" />
                  ) : (
                    <XCircle size={24} className="text-rose-400" />
                  )}
                  <div>
                    <p
                      className={`font-semibold ${
                        validateResult.valid ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {validateResult.valid ? "Valid ULPIN" : "Invalid ULPIN"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {String(validateResult.error || "Format is correct")}
                    </p>
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

      {tab === "history" && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History size={18} className="text-cyan-400" /> Generated ULPINs
              <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ml-2">
                {filteredHistory.length}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  className="input !py-2 !pl-9 text-sm w-48"
                  placeholder="Search code, plot, owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <select
                  className="input !py-2 !pl-9 text-sm w-40"
                  value={buildingFilter}
                  onChange={(e) => setBuildingFilter(e.target.value)}
                >
                  <option value="">All buildings</option>
                  {buildings.map((b) => (
                    <option key={String(b.id)} value={String(b.code)}>
                      {String(b.code)}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={loadHistory} className="btn-ghost text-xs !py-2 !px-3">
                Refresh
              </button>
            </div>
          </div>

          {historyError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
              {historyError}
            </div>
          )}

          {historyLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <History size={48} className="mx-auto mb-3 opacity-30" />
              <p>No ULPIN records found.</p>
              {!isAuthenticated && (
                <Link to="/login" className="btn-primary text-sm mt-4 inline-flex">
                  Sign in to generate the first one
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="pb-3 pr-4">ULPIN Code</th>
                    <th className="pb-3 pr-4">Plot</th>
                    <th className="pb-3 pr-4">Building</th>
                    <th className="pb-3 pr-4">Owner</th>
                    <th className="pb-3 pr-4">Generated</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((u) => (
                    <tr
                      key={String(u.id)}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-cyan-300 break-all max-w-[280px]">
                        {String(u.ulpin_code)}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{String(u.plot_code || "—")}</td>
                      <td className="py-3 pr-4 text-slate-300">{String(u.building_code || "—")}</td>
                      <td className="py-3 pr-4 text-slate-400">{String(u.owner_name || "—")}</td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">
                        {u.generated_at
                          ? new Date(String(u.generated_at)).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge ${
                            String(u.validated) === "1"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {String(u.validated) === "1" ? "Validated" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
