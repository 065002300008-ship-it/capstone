'use client';
import React, { useEffect, useState } from 'react';

export default function PengujianPage() {
  const [tests, setTests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    project_name: '',
    test_type: '',
    test_date: ''
  });

  const fetchData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/tests'),
        fetch('http://localhost:8000/api/v1/projects')
      ]);

      setTests(await tRes.json());
      setProjects(await pRes.json());
    } catch (err) {
      console.error("Koneksi gagal:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:8000/api/v1/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Gagal menyimpan");
        return;
      }

      alert("Data berhasil disimpan!");
      setIsModalOpen(false);
      setFormData({ id: '', project_name: '', test_type: '', test_date: '' });
      fetchData();

    } catch (err) {
      alert("Backend tidak terhubung");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">
          🧪 Daftar Pengujian
        </h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg shadow"
        >
          + Tambah
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-50 text-blue-700">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Proyek</th>
              <th className="p-4 text-left">Jenis Uji</th>
            </tr>
          </thead>

          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-6 text-gray-500">
                  Belum ada data
                </td>
              </tr>
            ) : (
              tests.map((t: any) => (
                <tr
                  key={t.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-semibold text-gray-800">{t.id}</td>
                  <td className="p-4 text-gray-700">{t.project_name}</td>
                  <td className="p-4 text-gray-700">{t.test_type}</td>
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

            <h2 className="text-xl font-bold text-blue-700 mb-4">
              Tambah Pengujian
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                placeholder="ID"
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2 rounded text-gray-800"
                value={formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                required
              />

              <select
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2 rounded text-gray-800"
                value={formData.project_name}
                onChange={e => setFormData({ ...formData, project_name: e.target.value })}
                required
              >
                <option value="">Pilih Proyek</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Jenis Uji"
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2 rounded text-gray-800"
                value={formData.test_type}
                onChange={e => setFormData({ ...formData, test_type: e.target.value })}
                required
              />

              <input
                type="date"
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2 rounded text-gray-800"
                value={formData.test_date}
                onChange={e => setFormData({ ...formData, test_date: e.target.value })}
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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