function resolveApiBase(): string {
  const candidates = [
    import.meta.env.VITE_API_URL,
    (typeof window !== "undefined" && window.__LANDVERSE_API_URL__) || "",
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    const v = String(c).trim().replace(/\/+$/, "").replace(/\/api$/, "");
    if (/^https?:\/\/.+/i.test(v)) return v;
  }
  return "";
}

const API_BASE = resolveApiBase();

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
    const detail = body.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d?.msg || JSON.stringify(d)).join(", ")
          : detail
            ? JSON.stringify(detail)
            : `Request failed: ${res.status}`;
    throw new Error(msg);
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
  changePassword: (current_password: string, new_password: string) =>
    request<{ message: string; reauth_required: boolean }>(
      "/auth/change-password",
      { method: "POST", body: JSON.stringify({ current_password, new_password }) }
    ),

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
  createBuilding: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>("/buildings", { method: "POST", body: JSON.stringify(data) }),
  updateBuilding: (id: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/buildings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBuilding: (id: number) =>
    request<void>(`/buildings/${id}`, { method: "DELETE" }),

  // Floors & Units
  getFloors: (buildingId?: number) =>
    request<Array<Record<string, unknown>>>(
      `/floors${buildingId ? `?building_id=${buildingId}` : ""}`
    ),
  createFloor: (buildingId: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/floors/${buildingId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteFloor: (floorId: number) =>
    request<void>(`/floors/${floorId}`, { method: "DELETE" }),
  getUnits: (floorId?: number) =>
    request<Array<Record<string, unknown>>>(
      `/units${floorId ? `?floor_id=${floorId}` : ""}`
    ),

  // ULPIN
  getULPINs: () => request<Array<Record<string, unknown>>>("/ulpin"),
  generateULPIN: (data: Record<string, unknown>) =>
    request("/ulpin/generate", { method: "POST", body: JSON.stringify(data) }),
  generateBuildingULPIN: (data: {
    plot_code?: string;
    building_code?: string;
    floors: number;
    size_sqm: number;
    building_type?: string;
    owner_name?: string;
  }) =>
    request<Record<string, unknown>>("/ulpin/generate-building", {
      method: "POST",
      body: JSON.stringify(data),
    }),
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
  latestAnalysisImage: () =>
    request<{ image_id: number | null; image_url: string | null }>("/analysis/latest-image"),
  analysisImageUrl: (id: number) => `${API_BASE}/api/analysis/images/${id}`,
};