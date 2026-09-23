declare global {
  interface Window {
    __LANDVERSE_API_URL__?: string;
  }
}

const raw =
  (typeof window !== "undefined" && window.__LANDVERSE_API_URL__) ||
  (import.meta.env.VITE_API_URL as string) ||
  "";
const API_URL: string = raw.replace(/\/+$/, "").replace(/\/api$/, "") + "/api";

export default API_URL;