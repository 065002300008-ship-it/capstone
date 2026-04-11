import React from 'react';

export default function Dashboard() {
  // Data Simulasi Progress Proyek
  const progressData = [
    { name: 'Renovasi Gedung Utama', progress: 85, color: 'bg-blue-500' },
    { name: 'Pembangunan Warehouse B', progress: 70, color: 'bg-green-500' },
    { name: 'Upgrade Sistem Listrik', progress: 92, color: 'bg-purple-500' },
    { name: 'Pemeliharaan Jalan Akses', progress: 25, color: 'bg-yellow-400' },
    { name: 'Konstruksi Jembatan Layang', progress: 60, color: 'bg-red-500' },
  ];

  // Data Simulasi Tabel Proyek Terbaru
  const recentProjects = [
    { name: 'Renovasi Gedung Utama', client: 'PT. Sinar Jaya', status: 'In Progress', deadline: '15/12/2024', statusColor: 'bg-blue-500' },
    { name: 'Pembangunan Warehouse B', client: 'CV. Maju Bersama', status: 'Testing', deadline: '30/11/2024', statusColor: 'bg-yellow-400' },
    { name: 'Upgrade Sistem Listrik', client: 'PT. Teknologi Modern', status: 'Near Complete', deadline: '20/10/2024', statusColor: 'bg-green-500' },
    { name: 'Pemeliharaan Jalan Akses', client: 'Dinas Pekerjaan Umum', status: 'Planning', deadline: '10/01/2025', statusColor: 'bg-gray-500' },
    { name: 'Konstruksi Jembatan Layang', client: 'PT. Infrastruktur Nusantara', status: 'In Progress', deadline: '25/11/2024', statusColor: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6 pb-8">
      
      {/* --- BARIS 1: Top Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Jumlah Proyek Aktif</p>
            <p className="text-3xl font-bold text-gray-800">8</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-2xl">📋</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Status Pengujian</p>
            <p className="text-md font-bold text-gray-800">5 On Progress, 12 Selesai, 2 Revisi</p>
            <p className="text-xs text-gray-400 mt-1">Total 19 pengujian</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center text-2xl">🧪</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Notifikasi Approval Laporan</p>
            <p className="text-3xl font-bold text-gray-800">4</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-2xl">📄</div>
        </div>
      </div>

      {/* --- BARIS 2: Grafik & Notifikasi --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom 1: Progress Proyek Aktif */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-6">Progress Proyek Aktif</h2>
          <div className="space-y-5">
            {progressData.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  <span className="text-gray-500">{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${item.color}`} style={{ width: `${item.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom 2: Status Pengujian (Donut Chart Simulasi) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative">
          <h2 className="text-base font-semibold text-gray-800 absolute top-6 left-6">Status Pengujian</h2>
          
          {/* Lingkaran Donut Custom */}
          <div className="relative w-40 h-40 mt-8 mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f3f4f6" strokeWidth="4"></circle>
              {/* Selesai (Hijau) 63% */}
              <circle cx="18" cy="18" r="16" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray="63 100" strokeDashoffset="0"></circle>
              {/* On Progress (Biru) 26% */}
              <circle cx="18" cy="18" r="16" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="26 100" strokeDashoffset="-63"></circle>
              {/* Revisi (Merah) 11% */}
              <circle cx="18" cy="18" r="16" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="11 100" strokeDashoffset="-89"></circle>
            </svg>
            {/* Teks di tengah Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">19</span>
              <span className="text-xs text-gray-500">Total</span>
            </div>
          </div>

          {/* Keterangan Lengenda */}
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-gray-600">On Progress</span></div><span className="font-medium">5 <span className="text-gray-400 text-xs font-normal">(26%)</span></span></div>
            <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-gray-600">Selesai</span></div><span className="font-medium">12 <span className="text-gray-400 text-xs font-normal">(63%)</span></span></div>
            <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-gray-600">Revisi</span></div><span className="font-medium">2 <span className="text-gray-400 text-xs font-normal">(11%)</span></span></div>
          </div>
        </div>

        {/* Kolom 3: Notifikasi */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Notifikasi</h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 font-medium">Proyek Renovasi Gedung Utama menunggu validasi laporan pengujian material</p>
              <p className="text-xs text-gray-400 mt-2">1 jam lalu</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 font-medium">Laporan QA/QC Proyek Warehouse B butuh approval</p>
              <p className="text-xs text-gray-400 mt-2">3 jam lalu</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 font-medium">Pengujian struktur beton Proyek Jembatan Layang telah selesai</p>
              <p className="text-xs text-gray-400 mt-2">5 jam lalu</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- BARIS 3: Tabel & Agenda --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabel Daftar Proyek Terbaru (Porsi 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Daftar Proyek Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Proyek</th>
                  <th className="px-6 py-4 font-semibold">Klien</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((proj, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{proj.name}</td>
                    <td className="px-6 py-4">{proj.client}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs font-medium text-white ${proj.statusColor}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{proj.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agenda Hari Ini (Porsi 1/3) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">📅</span>
            <h2 className="text-base font-semibold text-gray-800">Agenda Hari Ini</h2>
          </div>
          <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            <li className="relative flex items-center gap-4">
              <div className="absolute left-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white z-10"></div>
              <div className="pl-8">
                <p className="text-sm font-medium text-gray-800">Review laporan pengujian material</p>
                <p className="text-xs text-blue-600 font-semibold mt-1">09:00</p>
              </div>
            </li>
            <li className="relative flex items-center gap-4">
              <div className="absolute left-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white z-10"></div>
              <div className="pl-8">
                <p className="text-sm font-medium text-gray-800">Inspeksi kualitas konstruksi Warehouse B</p>
                <p className="text-xs text-blue-600 font-semibold mt-1">13:30</p>
              </div>
            </li>
            <li className="relative flex items-center gap-4">
              <div className="absolute left-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white z-10"></div>
              <div className="pl-8">
                <p className="text-sm font-medium text-gray-800">Meeting dengan klien PT. Sinar Jaya</p>
                <p className="text-xs text-blue-600 font-semibold mt-1">15:00</p>
              </div>
            </li>
            <li className="relative flex items-center gap-4">
              <div className="absolute left-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white z-10"></div>
              <div className="pl-8">
                <p className="text-sm font-medium text-gray-800">Approval hasil uji laboratorium</p>
                <p className="text-xs text-blue-600 font-semibold mt-1">16:30</p>
              </div>
            </li>
          </ul>
        </div>

      </div>
      
      {/* Footer Ringkas */}
      <div className="text-center pt-8 text-xs text-gray-400">
        &copy; 2026 PT. Mixindo Abadi Karya. All rights reserved.
      </div>
    </div>
  );
}