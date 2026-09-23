import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "../api/client";
import type { User, AuthToken } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bhumi_token");
    if (stored) {
      setToken(stored);
      api.me()
        .then((u) => setUser(u as unknown as User))
        .catch(() => {
          localStorage.removeItem("bhumi_token");
          setToken(null);
        });
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("bhumi_token", newToken);
    setToken(newToken);
    api.me()
      .then((u) => setUser(u as unknown as User))
      .catch(() => {});
  };

  const logout = () => {
    localStorage.removeItem("bhumi_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}