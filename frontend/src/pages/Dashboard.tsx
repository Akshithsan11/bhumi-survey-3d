import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Building2, MapPin, Layers, Home, Shield, Zap, Cpu, TrendingUp } from "lucide-react";

export function Dashboard() {
  const [stats, setStats] = useState({
    buildings: 0, parcels: 0, floors: 0, units: 0,
    ulpins: 0, underground_assets: 0, avg_confidence: 0,
  });
  const [types, setTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboardStats(), api.buildingTypes()])
      .then(([s, t]) => {
        setStats(s as typeof stats);
        setTypes(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Buildings", value: stats.buildings, icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Parcels", value: stats.parcels, icon: MapPin, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Floors", value: stats.floors, icon: Layers, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Units", value: stats.units, icon: Home, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "ULPINs", value: stats.ulpins, icon: Shield, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Underground", value: stats.underground_assets, icon: Zap, color: "text-rose-400", bg: "bg-rose-500/10" },
    { label: "AI Confidence", value: `${stats.avg_confidence}%`, icon: Cpu, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Score", value: "85/100", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-1">Live property intelligence overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="card animate-fade-in hover:border-blue-500/20 transition-all" style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon size={20} className={c.color} />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Building types chart */}
      <div className="card animate-fade-in" style={{ animationDelay: "500ms" }}>
        <h2 className="text-lg font-semibold mb-4">Building Types</h2>
        {types.length === 0 ? (
          <p className="text-slate-500 text-sm">No building data yet.</p>
        ) : (
          <div className="space-y-3">
            {types.map((t) => {
              const max = Math.max(...types.map((x) => x.count));
              const pct = (t.count / max) * 100;
              return (
                <div key={t.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 capitalize">{t.type}</span>
                    <span className="text-slate-500">{t.count}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}