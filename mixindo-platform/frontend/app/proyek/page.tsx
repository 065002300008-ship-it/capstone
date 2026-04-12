'use client';
import React, { useEffect, useState } from 'react';

export default function ProjectPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    client_name: '',
    start_date: '',
    deadline: '',
    status: 'Planning',
    budget: 0,
    progress: 0
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:8000/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + data.detail);
        return;
      }

      alert("Proyek berhasil ditambahkan!");
      setIsModalOpen(false);
      fetchProjects();

    } catch (error) {
      console.error(error);
      alert("Server tidak merespon!");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Planning") return "bg-gray-200 text-gray-700";
    if (status === "In Progress") return "bg-blue-100 text-blue-700";
    if (status === "Completed") return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  const inputStyle =
    "w-full border p-2 rounded bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Daftar Proyek</h1>
          <p className="text-gray-500 text-sm">Kelola semua proyek</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold shadow"
        >
          + Tambah Proyek
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="p-4">ID</th>
              <th>Nama</th>
              <th>Client</th>
              <th>Status</th>
              <th>Progress</th>
            </tr>
          </thead>

          <tbody>
            {projects.length > 0 ? (
              projects.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-blue-600 font-bold">{p.id}</td>
                  <td className="text-gray-800 font-medium">{p.name}</td>
                  <td className="text-gray-600">{p.client_name}</td>

                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>

                  <td className="w-[150px]">
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{p.progress}%</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-6 text-gray-400">
                  Belum ada proyek
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">

            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
              Tambah Proyek Baru
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">

              <p className="font-semibold text-blue-600">Informasi Proyek</p>

              <input
                placeholder="ID Proyek"
                className={inputStyle}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
              />

              <input
                placeholder="Nama Proyek"
                className={inputStyle}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />

              <textarea
                placeholder="Deskripsi"
                className={inputStyle}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />

              <input
                placeholder="Client"
                className={inputStyle}
                onChange={e => setFormData({ ...formData, client_name: e.target.value })}
              />

              <p className="font-semibold text-green-600">Manajemen</p>

              <select
                className={inputStyle}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option>Planning</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>

              <input
                type="number"
                placeholder="Budget"
                className={inputStyle}
                onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
              />

              <p className="font-semibold text-purple-600">Waktu</p>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className={inputStyle}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                />

                <input
                  type="date"
                  className={inputStyle}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-500 hover:text-black"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold"
                >
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