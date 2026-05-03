import { create } from "zustand";
import { authAPI, setAuthToken } from "../services/api";

interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "student" | "provider" | "admin" | "institution";
  phone?: string;
  kyc_status?: "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
  institution_name?: string;
  student_number?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: "student" | "provider";
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login(email, password);
      const { token, user } = res.data;
      setAuthToken(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.register(data);
      const { token, user } = res.data;
      setAuthToken(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  setToken: (token) => {
    setAuthToken(token);
    set({ token, isAuthenticated: true });
  },
}));
