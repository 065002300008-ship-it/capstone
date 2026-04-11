'use client';
import React, { useEffect, useState } from 'react';

export default function LaporanPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', project_name: '' });

  // Ambil data laporan dan proyek
  const fetchData = async () => {
    try {
      const [repRes, projRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/reports'),
        fetch('http://localhost:8000/api/v1/projects')
      ]);

      const reportsData = await repRes.json();
      const projectsData = await projRes.json();

      setReports(Array.isArray(reportsData) ? reportsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (err) {
      console.error("Koneksi gagal:", err);
      alert("Gagal memuat data. Pastikan backend berjalan dan endpoint benar.");
      setReports([]);
      setProjects([]);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Submit laporan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id || !formData.title || !formData.project_name) {
      alert("Semua field wajib diisi!");
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Gagal menyimpan laporan");
        return;
      }

      alert("Laporan berhasil dibuat!");
      setIsModalOpen(false);
      setFormData({ id: '', title: '', project_name: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Backend tidak terhubung. Pastikan server FastAPI berjalan.");
    }
  };

  // Hapus laporan
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan ini?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus laporan');
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Backend tidak terhubung atau laporan tidak ditemukan");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">📄 Daftar Laporan</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
        >
          + Tambah
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-green-50 text-green-700">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Judul Laporan</th>
              <th className="p-4 text-left">Proyek</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-6 text-gray-500">
                  Belum ada laporan atau gagal load data
                </td>
              </tr>
            ) : (
              reports.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-4 font-semibold text-gray-800">{r.id}</td>
                  <td className="p-4 text-gray-700">{r.title}</td>
                  <td className="p-4 text-gray-700">{r.project_name}</td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {r.status || 'Generated'}
                    </span>
                  </td>
                  <td className="p-4 space-x-2">
                    <button className="text-green-600 hover:underline">View</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-green-700 mb-4">Tambah Laporan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                placeholder="ID (REP-001)"
                className="w-full border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 p-2 rounded text-gray-800"
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                required
              />
              <input
                placeholder="Judul Laporan"
                className="w-full border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 p-2 rounded text-gray-800"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <select
                className="w-full border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 p-2 rounded text-gray-800"
                value={formData.project_name}
                onChange={e => setFormData({ ...formData, project_name: e.target.value })}
                required
              >
                <option value="">Pilih Proyek</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Batal</button>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}