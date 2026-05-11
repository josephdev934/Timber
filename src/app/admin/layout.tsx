"use client";

import React, { useEffect } from 'react';
import { AdminNavbar } from '@/components/admin/layout/AdminNavbar';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { ToastProvider } from '@/components/admin/shared/useToast';
import { AdminToastContainer } from '@/components/admin/shared/AdminToast';
import { AdminProvider } from '@/context/AdminContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Ensure theme variables are set. For now, default to light mode if not set.
  useEffect(() => {
    document.documentElement.classList.add('admin-theme');
  }, []);

  return (
    <AdminProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
          <AdminNavbar />
          <AdminSidebar />
          
          {/* Main Content Area */}
          <main className="pt-16 md:pl-[260px] min-h-screen">
            <div className="p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          
          <AdminToastContainer />
        </div>
      </ToastProvider>
    </AdminProvider>
  );
}
