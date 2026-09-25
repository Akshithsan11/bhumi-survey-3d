import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Building2, Plus, Pencil, Trash2, Sparkles, Lock, Loader2, X, Check,
} from "lucide-react";

interface PlotBuilderPanelProps {
  buildings: Array<Record<string, unknown>>;
  ulpins: Array<Record<string, unknown>>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onChanged: () => void;
}

const emptyForm = {
  plot_code: "",
  building_code: "",
  floors: "5",
  size_sqm: "400",
  building_type: "residential",
  owner_name: "",
};

export function PlotBuilderPanel({
  buildings,
  ulpins,
  selectedId,
  onSelect,
  onChanged,
}: PlotBuilderPanelProps) {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ floors: "", size_sqm: "", building_type: "residential" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const selected = useMemo(
    () => buildings.find((b) => Number(b.id) === selectedId) || null,
    [buildings, selectedId]
  );

  const selectedUlpin = useMemo(() => {
    if (!selected) return null;
    const code = String(selected.code || "");
    return (
      ulpins.find((u) => String(u.building_code || "") === code) ||
      ulpins.find((u) => Number(u.property_id) === Number(selected.id)) ||
      null
    );
  }, [selected, ulpins]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      setMsg({ ok: false, text: "Sign in to create plots and generate ULPINs." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await api.generateBuildingULPIN({
        plot_code: form.plot_code.trim() || undefined,
        building_code: form.building_code.trim() || undefined,
        floors: Math.max(1, Math.min(60, Number(form.floors) || 1)),
        size_sqm: Math.max(1, Number(form.size_sqm) || 100),
        building_type: form.building_type,
        owner_name: form.owner_name.trim() || undefined,
      });
      setMsg({
        ok: true,
        text: `Created ${String(res.building_code)} · ULPIN ${String(res.ulpin_code)}`,
      });
      onSelect(Number(res.building_id));
      onChanged();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Create failed" });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(b: Record<string, unknown>) {
    setEditingId(Number(b.id));
    setEditForm({
      floors: String(b.total_floors ?? 1),
      size_sqm: String(Number(b.area_sqm) || 400),
      building_type: String(b.building_type || "residential"),
    });
    setConfirmDeleteId(null);
    setMsg(null);
  }

  async function handleSaveEdit() {
    if (editingId == null) return;
    setBusy(true);
    setMsg(null);
    try {
      const floors = Math.max(1, Math.min(60, Number(editForm.floors) || 1));
      const size = Math.max(1, Number(editForm.size_sqm) || 100);
      const height = Math.round(floors * 3.4 * 10) / 10;
      await api.updateBuilding(editingId, {
        total_floors: floors,
        height_m: String(height),
        area_sqm: String(Math.round(size * 100) / 100),
        building_type: editForm.building_type,
      });

      const existing = await api.getFloors(editingId);
      const have = new Set(existing.map((f) => Number(f.floor_number)));
      for (let n = 1; n <= floors; n++) {
        if (!have.has(n)) {
          await api.createFloor(editingId, { floor_number: n, floor_height_m: "3.4", total_units: 0 });
        }
      }
      for (const f of existing) {
        const num = Number(f.floor_number);
        if (num > floors) await api.deleteFloor(Number(f.id));
      }

      setMsg({ ok: true, text: "Plot updated." });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    setBusy(true);
    setMsg(null);
    try {
      await api.deleteBuilding(id);
      if (selectedId === id) onSelect(-1);
      setConfirmDeleteId(null);
      setEditingId(null);
      setMsg({ ok: true, text: "Plot deleted." });
      onChanged();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Delete failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Plus size={18} className="text-cyan-400" /> Create plot → 3D building
        </h3>

        {!isAuthenticated && (
          <div className="mb-3 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
            <Lock size={14} className="shrink-0" />
            <span>Sign in to create plots &amp; generate ULPINs.</span>
            <Link to="/login" className="btn-primary !py-1 !px-3 ml-auto text-[11px]">
              Sign In
            </Link>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-slate-400 text-xs">Plot / ULPIN code (opt.)</span>
              <input
                className="input-field mt-1 w-full"
                placeholder="PRC-001"
                value={form.plot_code}
                onChange={(e) => set("plot_code", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-slate-400 text-xs">Building code (opt.)</span>
              <input
                className="input-field mt-1 w-full"
                placeholder="BLD-010"
                value={form.building_code}
                onChange={(e) => set("building_code", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-slate-400 text-xs">Floors *</span>
              <input
                className="input-field mt-1 w-full"
                type="number"
                min={1}
                max={60}
                required
                value={form.floors}
                onChange={(e) => set("floors", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-slate-400 text-xs">Approx. size (m²) *</span>
              <input
                className="input-field mt-1 w-full"
                type="number"
                min={1}
                step="any"
                required
                value={form.size_sqm}
                onChange={(e) => set("size_sqm", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-slate-400 text-xs">Type</span>
              <select
                className="input-field mt-1 w-full"
                value={form.building_type}
                onChange={(e) => set("building_type", e.target.value)}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed use</option>
                <option value="tower">Tower</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-400 text-xs">Owner (opt.)</span>
              <input
                className="input-field mt-1 w-full"
                placeholder="Your name"
                value={form.owner_name}
                onChange={(e) => set("owner_name", e.target.value)}
              />
            </label>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5 inline-flex items-center justify-center gap-2">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Generate building + ULPIN
          </button>
        </form>

        {msg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs border ${
              msg.ok
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Building2 size={18} className="text-blue-400" /> Your plots ({buildings.length})
        </h3>
        {buildings.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">
            Nothing created yet — the form above builds a live 3D plot.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {buildings.map((b) => {
              const id = Number(b.id);
              const active = selectedId === id;
              const editing = editingId === id;
              const ulpin = ulpins.find(
                (u) =>
                  String(u.building_code || "") === String(b.code || "") ||
                  Number(u.property_id) === id
              );
              return (
                <div
                  key={id}
                  className={`rounded-xl border p-3 text-xs transition ${
                    active
                      ? "border-cyan-400/50 bg-cyan-500/10"
                      : "border-slate-700/60 bg-slate-900/50 hover:border-slate-500/60"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelect(active ? -1 : id)}
                      className="font-mono font-semibold text-cyan-300 hover:underline"
                    >
                      {String(b.code)}
                    </button>
                    <span className="text-slate-400">
                      {String(b.total_floors ?? "?")} fl · {String(b.area_sqm ?? "?")} m²
                    </span>
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => (editing ? setEditingId(null) : startEdit(b))}
                        className="p-1.5 rounded-lg hover:bg-slate-700/70 text-slate-300"
                        title="Edit"
                      >
                        {editing ? <X size={13} /> : <Pencil size={13} />}
                      </button>
                      {confirmDeleteId === id ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(id)}
                          disabled={busy}
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300"
                          title="Confirm delete"
                        >
                          <Check size={13} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </span>
                  </div>
                  {ulpin && (
                    <p className="font-mono text-[10px] text-cyan-400/90 mt-1 break-all">
                      {String(ulpin.ulpin_code)}
                    </p>
                  )}
                  {editing && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <input
                        className="input-field !py-1 text-[11px]"
                        type="number"
                        min={1}
                        max={60}
                        value={editForm.floors}
                        onChange={(e) => setEditForm((f) => ({ ...f, floors: e.target.value }))}
                        title="Floors"
                      />
                      <input
                        className="input-field !py-1 text-[11px]"
                        type="number"
                        min={1}
                        step="any"
                        value={editForm.size_sqm}
                        onChange={(e) => setEditForm((f) => ({ ...f, size_sqm: e.target.value }))}
                        title="Size m²"
                      />
                      <select
                        className="input-field !py-1 text-[11px]"
                        value={editForm.building_type}
                        onChange={(e) => setEditForm((f) => ({ ...f, building_type: e.target.value }))}
                      >
                        <option value="residential">Resid.</option>
                        <option value="commercial">Comm.</option>
                        <option value="mixed">Mixed</option>
                        <option value="tower">Tower</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={busy}
                        className="btn-primary col-span-3 !py-1.5 text-[11px] inline-flex items-center justify-center gap-1"
                      >
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Save changes
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && selectedUlpin && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" /> Selected ULPIN
          </h3>
          <p className="font-mono text-xs text-cyan-300 break-all">{String(selectedUlpin.ulpin_code)}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Owner: {String(selectedUlpin.owner_name || "—")} ·{" "}
            {String(selectedUlpin.validated) === "1" ? "Validated" : "Pending"}
          </p>
          <Link to="/ulpin" className="btn-ghost text-xs w-full !py-2 mt-3 text-center block">
            Open ULPIN registry
          </Link>
        </div>
      )}
    </div>
  );
}
