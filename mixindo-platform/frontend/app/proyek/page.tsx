'use client';
import React, { useEffect, useState } from 'react';

export default function ProjectPage() {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', client_name: '', start_date: '', deadline: '', status: 'Planning', progress: 0
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/projects');
      const data = await res.json();
      // Perbaikan baris 15:
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat proyek:", err);
      setProjects([]);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:8000/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert("Proyek Berhasil Ditambahkan!");
      setIsModalOpen(false);
      fetchProjects();
    } else {
      const error = await res.json();
      alert("Gagal: " + (error.detail || "Terjadi kesalahan"));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Daftar Proyek PT Mixindo</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-md">+ Tambah Proyek</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nama Proyek</th>
              <th className="p-4">Klien</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.length > 0 ? (
              projects.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold text-blue-600">{p.id}</td>
                  <td className="p-4">{p.name}</td>
                  <td className="p-4">{p.client_name}</td>
                  <td className="p-4">{p.status}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada proyek terdaftar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-black">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6 border-b pb-2">Input Proyek Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="ID (Contoh: PRJ-01)" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, id: e.target.value})} required />
              <input type="text" placeholder="Nama Proyek" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input type="text" placeholder="Klien" className="w-full p-2 border rounded bg-white" onChange={e => setFormData({...formData, client_name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="p-2 border rounded bg-white" onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                <input type="date" className="p-2 border rounded bg-white" onChange={e => setFormData({...formData, deadline: e.target.value})} required />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">Batal</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}