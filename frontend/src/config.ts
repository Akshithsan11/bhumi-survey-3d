declare global {
  interface Window {
    __LANDVERSE_API_URL__?: string;
  }
}

const API_URL: string =
  (typeof window !== "undefined" && window.__LANDVERSE_API_URL__) ||
  (import.meta.env.VITE_API_URL as string) ||
  "/api";

export default API_URL;