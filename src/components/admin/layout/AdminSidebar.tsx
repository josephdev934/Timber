"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UsersRound, 
  ShieldAlert, 
  MessageSquare, 
  Image as ImageIcon, 
  Activity, 
  Bell, 
  Settings,
  LogOut,
  Wrench
} from 'lucide-react';

import { useAdmin } from '@/context/AdminContext';

export function AdminSidebar() {
  const { admin, logout } = useAdmin();
  const pathname = usePathname() || '/admin';
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const navigation = [
    {
      title: "MAIN",
      items: [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Analytics", href: "/admin/analytics", icon: Activity },
      ]
    },
    {
      title: "COMMUNITY",
      items: [
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Groups", href: "/admin/groups", icon: UsersRound },
        { name: "Moderation", href: "/admin/reports", icon: ShieldAlert },
      ]
    },
    {
      title: "CONTENT",
      items: [
        { name: "Posts", href: "/admin/posts", icon: MessageSquare },
        { name: "Media", href: "/admin/media", icon: ImageIcon },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Real-Time Monitor", href: "/admin/monitor", icon: Activity },
        { name: "Notifications", href: "/admin/notifications", icon: Bell },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[260px] bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col transition-all duration-300 z-30 hidden md:flex">
      
      {/* Profile Card */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 p-3 bg-[var(--color-elevated)] rounded-3xl border border-[var(--color-border)]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-brand)] to-blue-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
            {admin?.profilePhoto ? (
              <img src={admin.profilePhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              admin ? getInitials(admin.name) : 'A'
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold font-sans text-[var(--color-text)] truncate text-sm">
              {admin?.name || 'Admin'}
            </h3>
            <p className="text-xs text-[var(--color-muted)] font-mono truncate">
              {admin?.role === 'admin' ? 'System Administrator' : 'System Controller'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin py-4 px-4 space-y-6">
        {navigation.map((group) => (
          <div key={group.title}>
            <div className="mb-2 px-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">
                {group.title}
              </span>
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-2xl font-sans text-sm font-medium transition-all duration-300 group relative overflow-hidden
                        ${isActive 
                          ? 'text-[var(--color-brand)] bg-[var(--color-brand)]/10' 
                          : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]'}
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--color-brand)] rounded-r-full" />
                      )}
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-brand)]' : 'group-hover:text-[var(--color-text)]'}`} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Pinned */}
      <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg)] space-y-4">
        {/* Maintenance Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-elevated)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[var(--color-muted)]" />
            <span className="text-xs font-sans font-medium text-[var(--color-text)]">Maintenance</span>
          </div>
          <button 
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`
              w-10 h-5 rounded-full relative transition-colors duration-300
              ${maintenanceMode ? 'bg-red-500' : 'bg-emerald-500/20'}
            `}
          >
            <div className={`
              absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300
              ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}
            `} />
          </button>
        </div>

        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-2xl font-sans text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

    </aside>
  );
}
