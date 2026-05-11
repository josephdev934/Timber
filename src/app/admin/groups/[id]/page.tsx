"use client";

import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Image as ImageIcon, 
  ChevronLeft, 
  Settings, 
  UserPlus, 
  MoreVertical,
  Camera,
  Trash2,
  Archive,
  Eye,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';

export default function GroupDetailPage() {
  const [activeTab, setActiveTab] = useState('members');

  return (
    <div className="animate-in fade-in duration-500">
      {/* Back Button */}
      <Link 
        href="/admin/groups" 
        className="inline-flex items-center gap-2 text-sm font-sans font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] mb-6 transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Groups
      </Link>

      {/* Header / Banner */}
      <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden mb-8">
        <div className="h-48 bg-[var(--color-elevated)] relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Users className="w-32 h-32 text-[var(--color-text)]" />
          </div>
          <div className="absolute bottom-6 left-8 flex items-end gap-6">
            <div className="w-24 h-24 rounded-3xl bg-[var(--color-surface)] border-4 border-[var(--color-surface)] shadow-xl flex items-center justify-center overflow-hidden">
              <Users className="w-12 h-12 text-[var(--color-brand)]" />
            </div>
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold font-sans text-[var(--color-text)]">Copenhagen Tech</h1>
                <StatusBadge status="active" />
              </div>
              <p className="text-[var(--color-muted)] font-sans text-sm">Created Oct 12, 2023 • Admin: Felix Anderson</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-8 py-4 bg-[var(--color-surface)] flex items-center gap-8 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--color-muted)]" />
            <span className="text-sm font-mono font-bold text-[var(--color-text)]">1,240</span>
            <span className="text-xs font-sans text-[var(--color-muted)]">Members</span>
          </div>
          <div className="w-px h-4 bg-[var(--color-border)]" />
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--color-muted)]" />
            <span className="text-sm font-mono font-bold text-[var(--color-text)]">42.8k</span>
            <span className="text-xs font-sans text-[var(--color-muted)]">Messages</span>
          </div>
          <div className="w-px h-4 bg-[var(--color-border)]" />
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[var(--color-muted)]" />
            <span className="text-sm font-mono font-bold text-[var(--color-text)]">2.1k</span>
            <span className="text-xs font-sans text-[var(--color-muted)]">Media Files</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[var(--color-border)] mb-8">
        {['members', 'settings', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-sans font-bold capitalize transition-all duration-300 relative ${
              activeTab === tab ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-brand)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'members' && (
          <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-elevated)]/20">
              <h3 className="text-lg font-bold font-sans text-[var(--color-text)]">Member Management</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-brand)] text-white text-xs font-sans font-bold hover:opacity-90 transition-all duration-300">
                <UserPlus className="w-3 h-3" /> Add Member
              </button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] font-sans">
                  <th className="px-8 py-4">Member</th>
                  <th className="px-8 py-4">Role</th>
                  <th className="px-8 py-4">Joined</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="hover:bg-[var(--color-elevated)]/30 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-elevated)]" />
                        <span className="text-sm font-sans text-[var(--color-text)] font-medium">User #{i}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-sans bg-[var(--color-elevated)] border border-[var(--color-border)] text-[var(--color-muted)]">
                        {i === 1 ? 'Administrator' : 'Member'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-mono text-[var(--color-muted)]">Oct {i + 10}, 2023</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button className="text-xs font-sans font-bold text-red-500 hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* General Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] p-8">
                <h3 className="text-lg font-bold font-sans text-[var(--color-text)] mb-6">Group Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-2">Group Name</label>
                    <input 
                      type="text" 
                      defaultValue="Copenhagen Tech" 
                      className="w-full px-4 py-3 rounded-2xl bg-[var(--color-elevated)] border border-[var(--color-border)] focus:border-[var(--color-brand)] focus:outline-none text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-2">Group Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center relative group cursor-pointer overflow-hidden">
                        <Users className="w-8 h-8 text-[var(--color-muted)]" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-[var(--color-muted)] max-w-[200px]">JPG or PNG. Max size 2MB. Recommended 500x500px.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                  <button className="px-8 py-3 rounded-full bg-[var(--color-brand)] text-white font-sans text-sm font-bold hover:opacity-90 transition-all active:scale-95">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-6">
              <div className="bg-red-500/5 rounded-3xl border border-red-500/20 p-8">
                <h3 className="text-lg font-bold font-sans text-red-500 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-xs font-sans text-[var(--color-muted)] mb-6">These actions are irreversible. Please proceed with extreme caution.</p>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-red-500/30 text-red-500 font-sans text-sm font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95">
                    <Archive className="w-4 h-4" /> Archive Group
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-sans text-sm font-bold hover:bg-red-700 transition-all active:scale-95">
                    <Trash2 className="w-4 h-4" /> Disband Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
