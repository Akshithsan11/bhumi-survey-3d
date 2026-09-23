import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export interface User {
  id: number;
  username: string;
  email: string;
  token?: string;
}

export const AuthContext = createContext({
  user: null as User | null,
  login: (token: string) => {},
  logout: () => {},
  isAuthenticated: boolean,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Check for token on load
  useEffect(() => {
    const token = localStorage.getItem("bhumi_token");
    if (token) {
      setUser({ id: 1, username: "user", email: "", token });
    }
  }, []);

  const login = (token: string) => {
    setUser({ id: 1, username: "user", email: "", token });
    localStorage.setItem("bhumi_token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bhumi_token");
  };

  return <Context.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</Context.Provider>;
};