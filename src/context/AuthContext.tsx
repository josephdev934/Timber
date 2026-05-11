"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  profilePhoto?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * ==========================================
 * COMPONENT: AuthProvider
 * ==========================================
 * Manages the global authentication state.
 * Handles persistence via localStorage and token-based resolution.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("timber_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem("timber_role", data.user.role);
        } else {
          localStorage.removeItem("timber_token");
          localStorage.removeItem("timber_role");
        }
      } catch (err) {
        console.error("[AUTH_INIT_FAILED]", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem("timber_token", token);
    localStorage.setItem("timber_role", userData.role);
    setUser(userData);
    router.push("/");
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    localStorage.removeItem("timber_token");
    localStorage.removeItem("timber_role");
    setUser(null);
    router.push("/login");
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
