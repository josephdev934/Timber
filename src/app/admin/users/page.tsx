"use client";

import React, { useState, useEffect } from 'react';
import { UsersFilterBar } from '@/components/admin/users/UsersFilterBar';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { UserDetailDrawer } from '@/components/admin/users/UserDetailDrawer';
import { useAdmin } from '@/context/AdminContext';

export default function UsersPage() {
  const { token } = useAdmin();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Central Filter State
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    role: 'all',
    page: 1,
    limit: 20
  });

  const [data, setData] = useState<any>({ users: [], pagination: {} });
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        search: filters.search,
        status: filters.status,
        role: filters.role
      });

      const res = await fetch(`/api/admin/users?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("[USERS_FETCH_FAILED]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, filters]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-sans text-[var(--color-text)] tracking-tight mb-2">
          Users
        </h1>
        <p className="text-[var(--color-muted)] font-sans">
          Managing {data.pagination.total || '...'} registered community members.
        </p>
      </div>

      <UsersFilterBar 
        filters={filters} 
        setFilters={setFilters} 
        onRefresh={fetchUsers}
      />
      
      <UsersTable 
        users={data.users} 
        pagination={data.pagination}
        loading={loading}
        onPageChange={(page) => setFilters(f => ({ ...f, page }))}
        onUserClick={(id) => setSelectedUserId(id)}
        onRefresh={fetchUsers}
      />

      <UserDetailDrawer 
        userId={selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
      />
    </div>
  );
}
