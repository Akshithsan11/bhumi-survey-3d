const RAW_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.__LANDVERSE_API_URL__) ||
  "";
const API_BASE = RAW_BASE.replace(/\/+$/, "").replace(/\/api$/, "");

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("bhumi_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${API_BASE}/api${normalized}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string; expires_in: number }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  signup: (username: string, email: string, password: string) =>
    request<{ access_token: string; token_type: string; expires_in: number }>(
      "/auth/signup",
      { method: "POST", body: JSON.stringify({ username, email, password }) }
    ),
  me: () => request<Record<string, unknown>>("/auth/me"),

  // Stats
  dashboardStats: () => request<Record<string, number>>("/stats/dashboard"),
  buildingTypes: () => request<Array<{ type: string; count: number }>>("/stats/building-types"),

  // Parcels
  getParcels: () => request<Array<Record<string, unknown>>>("/parcels"),
  createParcel: (data: Record<string, unknown>) =>
    request("/parcels", { method: "POST", body: JSON.stringify(data) }),

  // Buildings
  getBuildings: () => request<Array<Record<string, unknown>>>("/buildings"),
  getBuilding: (id: number) => request<Record<string, unknown>>(`/buildings/${id}`),

  // Floors & Units
  getFloors: (buildingId?: number) =>
    request<Array<Record<string, unknown>>>(
      `/floors${buildingId ? `?building_id=${buildingId}` : ""}`
    ),
  getUnits: (floorId?: number) =>
    request<Array<Record<string, unknown>>>(
      `/units${floorId ? `?floor_id=${floorId}` : ""}`
    ),

  // ULPIN
  getULPINs: () => request<Array<Record<string, unknown>>>("/ulpin"),
  generateULPIN: (data: Record<string, unknown>) =>
    request("/ulpin/generate", { method: "POST", body: JSON.stringify(data) }),
  validateULPIN: (code: string) =>
    request<Record<string, unknown>>(`/ulpin/validate?ulpin_code=${encodeURIComponent(code)}`),

  // Validation
  runValidation: (buildingId: number) =>
    request("/validation", {
      method: "POST",
      body: JSON.stringify({ building_id: buildingId }),
    }),

  // Infrastructure
  getInfrastructure: () => request<Array<Record<string, unknown>>>("/infrastructure"),
  conflictCheck: (buildingId: number, depth: number) =>
    request("/infrastructure/conflict-check", {
      method: "POST",
      body: JSON.stringify({ building_id: buildingId, depth_m: depth }),
    }),

  // Analysis
  analyzePhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/api/analysis/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("bhumi_token") || ""}` },
      body: form,
    }).then((r) => r.json());
  },
};