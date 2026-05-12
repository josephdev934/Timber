"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { socketClient } from "@/infrastructure/socket/socketClient";

/**
 * ==========================================
 * ADMIN CONTEXT
 * ==========================================
 * Manages global state for the Admin Dashboard.
 * ==========================================
 */

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin';
  profilePhoto?: string;
}

interface AdminContextType {
  admin: AdminUser | null;
  token: string | null;
  loading: boolean;
  settings: any | null;
  logout: () => void;
  refreshSettings: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSettings = async (currentToken: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("[ADMIN_SETTINGS_LOAD_FAILED]", err);
    }
  };

  useEffect(() => {
    async function loadAdmin() {
      try {
        const storedToken = localStorage.getItem("timber_token");
        const res = await fetch("/api/auth/me", {
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user.role === 'admin') {
            setAdmin(data.user);
            setToken(storedToken);
            localStorage.setItem("timber_role", "admin");
            if (storedToken) await fetchSettings(storedToken);
          } else {
            router.push("/?error=access_denied");
          }
        } else {
          localStorage.removeItem("timber_token");
          localStorage.removeItem("timber_role");
          router.push("/login");
        }
      } catch (err) {
        console.error("[ADMIN_CONTEXT_LOAD_FAILED]", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();

    // Listen for global settings updates
    const socket = socketClient.getInstance();
    socketClient.joinRoom('global');
    
    const handleSettingsUpdate = (data: any) => {
      console.log(`[REALTIME_SETTINGS_SYNC] Section: ${data.section}`);
      setSettings(data.settings);
    };

    socket.on('SETTINGS_UPDATED', handleSettingsUpdate);

    return () => {
      socket.off('SETTINGS_UPDATED', handleSettingsUpdate);
    };
  }, [router]);

  const refreshSettings = async () => {
    if (token) await fetchSettings(token);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("timber_token");
      localStorage.removeItem("timber_role");
      setAdmin(null);
      setToken(null);
      router.push("/login");
    } catch (err) {
      console.error("[ADMIN_LOGOUT_FAILED]", err);
    }
  };

  return (
    <AdminContext.Provider value={{ admin, token, loading, settings, logout, refreshSettings }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
