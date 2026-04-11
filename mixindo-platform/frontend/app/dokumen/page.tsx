'use client';
import React, { useEffect, useState } from 'react';

export default function DokumenPage() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', category: 'QA Checklist', project_id: '', file_size: '' });

  const fetchData = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/documents'),
        fetch('http://localhost:8000/api/v1/projects')
      ]);
      const dData = await dRes.json();
      const pData = await pRes.json();
      
      // PERBAIKAN: Pastikan data selalu berbentuk ARRAY agar .map tidak error
      setDocuments(Array.isArray(dData) ? dData : []);
      setProjects(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error("Gagal sinkronisasi data:", err);
      setDocuments([]); // Jika error, set kosong agar tidak layar hitam
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.project_id) return alert("Pilih proyek dulu!");
    const res = await fetch('http://localhost:8000/api/v1/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) { setIsModalOpen(false); fetchData(); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Dokumen</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded">+ Registrasi Dokumen</button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left text-sm text-gray-800">
          <thead className="bg-gray-50 border-b">
            <tr><th className="p-4">ID</th><th className="p-4">Nama File</th><th className="p-4">Proyek</th><th className="p-4">Aksi</th></tr>
          </thead>
          <tbody>
            {documents.map((doc: any) => (
              <tr key={doc.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold text-blue-600">{doc.id}</td><td className="p-4">{doc.name}</td><td className="p-4">{doc.project_id}</td>
                <td className="p-4"><button onClick={async () => {await fetch(`http://localhost:8000/api/v1/documents/${doc.id}`, {method:'DELETE'}); fetchData();}} className="text-red-500">Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-black">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Registrasi Dokumen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="ID (dc-11)" className="w-full p-2.5 border rounded bg-white" onChange={e => setFormData({...formData, id: e.target.value})} required />
              <input type="text" placeholder="Nama File" className="w-full p-2.5 border rounded bg-white" onChange={e => setFormData({...formData, name: e.target.value})} required />
              
              {/* DROPDOWN DINAMIS */}
              <select className="w-full p-2.5 border rounded bg-white" onChange={e => setFormData({...formData, project_id: e.target.value})} required>
                <option value="">-- Pilih Proyek Terdaftar --</option>
                {projects.map((p: any) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>

              <input type="text" placeholder="Ukuran (MB)" className="w-full p-2.5 border rounded bg-white" onChange={e => setFormData({...formData, file_size: e.target.value})} required />
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)}>Batal</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow">Simpan ke SQL</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}