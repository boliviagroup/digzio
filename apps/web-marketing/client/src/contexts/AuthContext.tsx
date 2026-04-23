import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  AuthUser,
  login as apiLogin,
  register as apiRegister,
  RegisterPayload,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  clearStoredToken,
} from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(getStoredToken);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setStoredToken(res.token, res.refresh_token);
    setStoredUser(res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await apiRegister(payload);
    setStoredToken(res.token, res.refresh_token);
    setStoredUser(res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
