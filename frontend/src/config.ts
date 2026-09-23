declare global {
  interface Window {
    __LANDVERSE_API_URL__?: string;
  }
}

function pickBase(): string {
  const candidates = [
    typeof window !== "undefined" ? window.__LANDVERSE_API_URL__ : "",
    (import.meta.env.VITE_API_URL as string) || "",
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    const v = String(c).trim().replace(/\/+$/, "").replace(/\/api$/, "");
    if (/^https?:\/\/.+/i.test(v)) return v;
  }
  return "";
}

const API_URL: string = pickBase() + "/api";

export default API_URL;