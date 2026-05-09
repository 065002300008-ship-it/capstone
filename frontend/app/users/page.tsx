'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { alertConfirm, alertError, alertSuccess } from '@/lib/alerts';
import { apiFetch } from '@/lib/api';

type User = {
  id: string;
  username: string;
  email_or_phone?: string | null;
  status: 'active' | 'inactive';
  role: 'admin' | 'owner';
  last_seen_at?: string | null;
};

type UserForm = {
  email: string;
  username: string;
  password: string;
  status: User['status'];
  role: User['role'];
};

export default function UserManagementPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<UserForm>({
    email: '',
    username: '',
    password: '',
    status: 'active',
    role: 'admin',
  });

  const resetForm = () => setForm({ email: '', username: '', password: '', status: 'active', role: 'admin' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/users');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alertError('Gagal Memuat', 'Backend server tidak merespon.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAdd = () => {
    setIsEditMode(false);
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setIsEditMode(true);
    setEditingId(u.id);
    setForm({
      email: u.email_or_phone || '',
      username: u.username,
      password: '',
      status: u.status,
      role: u.role,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isAdd = !isEditMode;
      const url = isEditMode ? `/api/v1/users/${editingId}` : '/api/v1/users';
      const payload = isAdd
        ? {
            email_or_phone: form.email.trim(),
            username: form.username.trim(),
            password: form.password,
            status: form.status,
            role: form.role,
          }
        : {
            email_or_phone: form.email.trim(),
            status: form.status,
            role: form.role,
          };

      const res = await apiFetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alertError('Gagal', data.detail || 'Terjadi kesalahan pada server.');
        return;
      }
      await alertSuccess('Berhasil', isEditMode ? 'User diperbarui' : 'User ditambahkan');
      setIsModalOpen(false);
      setSelectedIds(new Set());
      fetchUsers();
    } catch (err) {
      console.error(err);
      alertError('Koneksi Gagal', 'Backend server tidak merespon.');
    }
  };

  const handleDelete = async (u: User) => {
    const ok = await alertConfirm('Hapus user?', `Hapus "${u.username}"?`, 'Ya, Hapus');
    if (!ok.isConfirmed) return;
    const res = await apiFetch(`/api/v1/users/${u.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alertError('Gagal', data.detail || 'Terjadi kesalahan pada server.');
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(u.id);
      return next;
    });
    fetchUsers();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice();
    return items.filter((u) => (u.username || '').toLowerCase().includes(q) || (u.email_or_phone || '').toLowerCase().includes(q));
  }, [items, search]);

  const sorted = useMemo(() => filtered.slice(), [filtered]);

  const allVisibleSelected = useMemo(() => {
    if (sorted.length === 0) return false;
    return sorted.every((u) => selectedIds.has(u.id));
  }, [sorted, selectedIds]);

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (sorted.length === 0) return next;
      const shouldSelect = !sorted.every((u) => next.has(u.id));
      for (const u of sorted) {
        if (shouldSelect) next.add(u.id);
        else next.delete(u.id);
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ok = await alertConfirm('Hapus user terpilih?', `Hapus ${ids.length} user terpilih?`, 'Ya, Hapus');
    if (!ok.isConfirmed) return;
    try {
      for (const id of ids) {
        const res = await apiFetch(`/api/v1/users/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alertError('Gagal', data.detail || 'Terjadi kesalahan pada server.');
          return;
        }
      }
      setSelectedIds(new Set());
      fetchUsers();
    } catch (err) {
      console.error(err);
      alertError('Koneksi Gagal', 'Backend server tidak merespon.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">Akses dibatasi untuk role admin/owner (sementara belum ada auth).</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email / username"
            className="w-full sm:w-[260px] px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={fetchUsers}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold"
          >
            Refresh
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            Hapus ({selectedIds.size})
          </button>
          <button
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transition"
          >
            + Tambah User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 border-b">
            <tr>
              <th className="px-4 py-4 w-[52px]">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="h-4 w-4 accent-blue-600"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Email/No Hp</th>
              <th className="px-6 py-4 font-semibold">Username</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Terakhir Dilihat</th>
              <th className="px-6 py-4 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Memuat...</td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {search.trim() ? 'User tidak ditemukan.' : 'Belum ada user.'}
                </td>
              </tr>
            ) : (
              sorted.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      aria-label={`Select ${u.username}`}
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelectOne(u.id)}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4">{u.email_or_phone || '-'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {u.last_seen_at ? new Date(u.last_seen_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openEdit(u)} className="text-blue-700 hover:underline font-semibold">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(u)} className="text-red-600 hover:underline font-semibold">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{isEditMode ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2.5 border rounded-lg bg-white text-black outline-none"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />

              <input
                type="text"
                placeholder="Username"
                className="w-full p-2.5 border rounded-lg bg-white text-black outline-none"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                disabled={isEditMode}
                autoComplete="username"
              />

              {!isEditMode ? (
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-2.5 border rounded-lg bg-white text-black outline-none"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <select
                  className="w-full p-2.5 border rounded-lg bg-white text-black outline-none"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as User['status'] })}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>

                <select
                  className="w-full p-2.5 border rounded-lg bg-white text-black outline-none"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}
                >
                  <option value="admin">admin</option>
                  <option value="owner">owner</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">
                  Batal
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
