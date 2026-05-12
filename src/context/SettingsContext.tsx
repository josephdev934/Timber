"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { socketClient } from "@/infrastructure/socket/socketClient";

/**
 * ==========================================
 * GLOBAL SETTINGS CONTEXT
 * ==========================================
 * Provides real-time platform branding and status to ALL users.
 * ==========================================
 */

interface SettingsContextType {
  settings: any | null;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchPublicSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("[PUBLIC_SETTINGS_LOAD_FAILED]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicSettings();

    // Listen for global real-time updates
    const socket = socketClient.getInstance();
    const handleSettingsUpdate = (data: any) => {
      console.log(`[GLOBAL_SYNC] Platform settings updated: ${data.section}`);
      // The broadcast contains the full updated settings object from the admin panel
      // We filter it here to match the public structure
      const newPublicSettings = {
        general: data.settings.general,
        maintenance: data.settings.maintenance,
        features: data.settings.features
      };
      setSettings(newPublicSettings);
    };

    socket.on('SETTINGS_UPDATED', handleSettingsUpdate);

    // Specific maintenance events
    socket.on('MAINTENANCE_MODE', (data: any) => {
      console.log('🔴 [MAINTENANCE_MODE] Triggered');
      setSettings((prev: any) => ({
        ...prev,
        maintenance: { enabled: true, message: data.message }
      }));
    });

    socket.on('MAINTENANCE_ENDED', () => {
      console.log('🟢 [MAINTENANCE_ENDED] Platform is back online');
      setSettings((prev: any) => ({
        ...prev,
        maintenance: { enabled: false }
      }));
    });

    return () => {
      socket.off('SETTINGS_UPDATED', handleSettingsUpdate);
      socket.off('MAINTENANCE_MODE');
      socket.off('MAINTENANCE_ENDED');
    };
  }, []);

  // Handle automatic redirection logic
  useEffect(() => {
    if (!settings || !settings.maintenance) return;

    const isMaintenancePage = pathname === '/maintenance';
    const isAdminPath = pathname?.startsWith('/admin');

    if (settings.maintenance.enabled) {
      if (!isMaintenancePage && !isAdminPath) {
        // We only redirect if NOT an admin (check local storage role as a quick client hint)
        const isClientAdmin = localStorage.getItem('timber_role') === 'admin';
        if (!isClientAdmin) {
          router.push('/maintenance');
        }
      }
    } else {
      if (isMaintenancePage) {
        router.push('/');
      }
    }
  }, [settings, pathname, router]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
