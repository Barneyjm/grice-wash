"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "./types";
import {
  getCurrentUser,
  setCurrentUser as persistUser,
  loginUser,
  createUser,
  createOrganization,
  seedDemoData,
} from "./store";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string) => string | null;
  register: (
    email: string,
    name: string,
    role: User["role"],
    orgName: string
  ) => string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDemoData();
    const u = getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  const login = useCallback((email: string): string | null => {
    const u = loginUser(email);
    if (!u) return "No account found with that email";
    setUser(u);
    persistUser(u);
    return null;
  }, []);

  const register = useCallback(
    (
      email: string,
      name: string,
      role: User["role"],
      orgName: string
    ): string | null => {
      try {
        let orgId: string;
        if (orgName) {
          const org = createOrganization(orgName);
          orgId = org.id;
        } else {
          return "Organization name is required";
        }
        const u = createUser(email, name, role, orgId);
        setUser(u);
        persistUser(u);
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
