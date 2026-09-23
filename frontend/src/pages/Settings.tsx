import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Shield, Lock, Eye, EyeOff, User, Mail, CheckCircle2, AlertCircle,
} from "lucide-react";

export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = (() => {
    let s = 0;
    if (next.length >= 8) s++;
    if (/[A-Z]/.test(next)) s++;
    if (/[0-9]/.test(next)) s++;
    if (/[^A-Za-z0-9]/.test(next)) s++;
    return s;
  })();

  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"][strength];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    if (next.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await api.changePassword(current, next);
      setSuccess(res.message || "Password changed. Please log in again.");
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-slate-400 mt-1">Profile and security</p>
      </div>

      <div className="grid gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User size={18} className="text-blue-400" /> Profile
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/40 rounded-xl">
              <User size={16} className="text-slate-500" />
              <span className="text-slate-400 w-24">Username</span>
              <span className="font-medium">{user?.username || "—"}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/40 rounded-xl">
              <Mail size={16} className="text-slate-500" />
              <span className="text-slate-400 w-24">Email</span>
              <span className="font-medium">{user?.email || "—"}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock size={18} className="text-emerald-400" /> Change Password
          </h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Current password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  className="input pr-12"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label="Toggle password visibility"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">New password</label>
              <input
                type={show ? "text" : "password"}
                className="input"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Min 6 characters"
              />
              {next.length > 0 && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${(strength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{strengthLabel}</span>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm new password</label>
              <input
                type={show ? "text" : "password"}
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
              {confirm && confirm !== next && (
                <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !current || !next || !confirm}
              className="btn-primary flex items-center gap-2"
            >
              <Shield size={16} />
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
