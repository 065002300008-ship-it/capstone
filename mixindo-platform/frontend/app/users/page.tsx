'use client';
import React, { useEffect, useState } from 'react';
import { alertSuccess, alertError, alertConfirm } from '@/lib/alerts';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '', full_name: '', email: '', role: 'Engineer', department: 'QA/QC'
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/users');
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error("Gagal memuat data user:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8000/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      await alertSuccess("User Berhasil Ditambahkan! 👤", `User "${formData.full_name}" telah ditambahkan ke database.`);
      setIsModalOpen(false);
      setFormData({ id: '', full_name: '', email: '', role: 'Engineer', department: 'QA/QC' });
      fetchUsers();
    } else {
      const error = await res.json();
      alertError("Gagal Menambahkan User", error.detail || "Terjadi kesalahan");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    const result = await alertConfirm("Hapus User?", `Apakah Anda yakin ingin menghapus user "${userName}"?`, "Ya, Hapus");

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/users/${userId}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        alertError("Gagal Menghapus", data.detail || "Terjadi kesalahan");
        return;
      }

      await alertSuccess("User Dihapus! 🗑️", `User "${userName}" telah dihapus dari database.`);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alertError("Koneksi Gagal", "Backend server tidak merespon.");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 italic">Memuat data pengguna...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">Kelola akses dan data karyawan PT Mixindo</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transition"
        >
          + Tambah User Baru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Nama Lengkap</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Departemen</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{u.full_name}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">{u.department}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleDelete(u.id, u.full_name)}
                    className="text-red-500 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1 rounded transition"
                  >
                    🗑️ Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Registrasi User Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="ID Pegawai (Contoh: USR-01)" className="w-full p-2.5 border rounded-lg bg-white text-black outline-none" 
                onChange={e => setFormData({...formData, id: e.target.value})} required />
              
              <input type="text" placeholder="Nama Lengkap" className="w-full p-2.5 border rounded-lg bg-white text-black outline-none" 
                onChange={e => setFormData({...formData, full_name: e.target.value})} required />
              
              <input type="email" placeholder="Email Kantor" className="w-full p-2.5 border rounded-lg bg-white text-black outline-none" 
                onChange={e => setFormData({...formData, email: e.target.value})} required />
              
              <select className="w-full p-2.5 border rounded-lg bg-white text-black outline-none" 
                onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="Engineer">Engineer</option>
                <option value="Admin">Admin</option>
                <option value="Project Manager">Project Manager</option>
              </select>

              <input type="text" placeholder="Departemen (Contoh: QA/QC)" className="w-full p-2.5 border rounded-lg bg-white text-black outline-none" 
                onChange={e => setFormData({...formData, department: e.target.value})} required />

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Simpan User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}