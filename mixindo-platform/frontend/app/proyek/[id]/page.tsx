'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { alertSuccess, alertConfirm } from '@/lib/alerts';

export default function ProjectDetailPage() {
  const [search, setSearch] = useState('');
  const { id } = useParams();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [newTask, setNewTask] = useState('');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const fetchData = async () => {
    try {
      const resProject = await fetch(`http://localhost:8000/api/v1/projects/${id}`);
      const projectData = await resProject.json();

      const resTasks = await fetch(`http://localhost:8000/api/v1/projects/${id}/tasks`);
      const taskData = await resTasks.json();

      setProject(projectData);
      setTasks(taskData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // ================= ADD =================
  const handleAddTask = async () => {
    if (!newTask) return;

    await fetch(`http://localhost:8000/api/v1/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: id,
        title: newTask
      })
    });

    setNewTask('');
    fetchData();
  };

  // ================= START EDIT =================
  const startEdit = (task: any) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditStatus(task.status);
  };

  // ================= SAVE EDIT =================
  const handleSaveEdit = async () => {
    if (!editingTaskId) return;

    const confirm = await alertConfirm(
      "Simpan perubahan?",
      "Perubahan pengujian akan disimpan",
      "Ya, Simpan"
    );

    if (!confirm.isConfirmed) return;

    await fetch(`http://localhost:8000/api/v1/tasks/${editingTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        status: editStatus
      })
    });

    setEditingTaskId(null);

    await alertSuccess("Berhasil", "Pengujian diperbarui");
    fetchData();
  };

  // ================= DELETE =================
  const handleDelete = async (taskId: string) => {
    const confirm = await alertConfirm(
      "Hapus pengujian?",
      "Data akan dihapus permanen",
      "Ya, Hapus"
    );

    if (!confirm.isConfirmed) return;

    await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`, {
      method: 'DELETE'
    });

    await alertSuccess("Berhasil", "Pengujian dihapus");
    fetchData();
  };

  // ================= STATUS COLOR =================
  const getStatusColor = (status: string) => {
    if (status === "Pending") return "bg-gray-200 text-gray-700";
    if (status === "In Progress") return "bg-blue-100 text-blue-700";
    if (status === "Done") return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  if (!project) return <div className="p-6">Loading...</div>;

  const filteredTasks = tasks
  .filter((t) => {
    const matchFilter = filter === 'All' || t.status === filter;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  })
  .sort((a, b) => {
    if (a.status === 'Done' && b.status !== 'Done') return 1;
    if (a.status !== 'Done' && b.status === 'Done') return -1;
    return 0;
  });

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Done').length;
  const pending = total - done;

  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const progressCount = tasks.filter(t => t.status === 'In Progress').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;

  const maxValue = Math.max(pendingCount, progressCount, doneCount, 1);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Kembali
      </button>

      <button
  onClick={() => window.open(`http://localhost:8000/api/v1/projects/${project.project_code}/report`)}
  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
>
  📄 Download Laporan
</button>

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-blue-700">
        {project.name}
      </h1>

      <p className="text-sm text-gray-500 mb-4">
        Kode Proyek:
        <span className="ml-2 font-mono text-blue-600">
          {project.project_code}
        </span>
      </p>

      {/* PROGRESS */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `${project.progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>Progress</span>
          <span className="font-semibold">{project.progress}%</span>
        </div>
      </div>

      {/* INFO */}
      <div className="space-y-1">
        <p><b>Client:</b> {project.client_name}</p>
        <p><b>Status:</b> {project.status}</p>
        <p><b>Deskripsi:</b> {project.description || '-'}</p>
      </div>

      {/* ================= PENGUJIAN ================= */}

      <div className="bg-white p-4 rounded-xl shadow mb-6">

  <h3 className="text-md font-semibold mb-3">Statistik Pengujian</h3>

  {/* Pending */}
  <div className="mb-2">
    <div className="flex justify-between text-xs mb-1">
      <span>Pending</span>
      <span>{pendingCount}</span>
    </div>
    <div className="w-full bg-gray-200 h-3 rounded">
      <div
        className="bg-gray-500 h-3 rounded transition-all duration-500"
        style={{ width: `${(pendingCount / maxValue) * 100}%` }}
      />
    </div>
  </div>

  {/* In Progress */}
  <div className="mb-2">
    <div className="flex justify-between text-xs mb-1">
      <span>In Progress</span>
      <span>{progressCount}</span>
    </div>
    <div className="w-full bg-gray-200 h-3 rounded">
      <div
        className="bg-blue-500 h-3 rounded transition-all duration-500"
        style={{ width: `${(progressCount / maxValue) * 100}%` }}
      />
    </div>
  </div>

  {/* Done */}
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span>Done</span>
      <span>{doneCount}</span>
    </div>
    <div className="w-full bg-gray-200 h-3 rounded">
      <div
        className="bg-green-500 h-3 rounded transition-all duration-500"
        style={{ width: `${(doneCount / maxValue) * 100}%` }}
      />
    </div>
  </div>

</div>



      <div className="bg-white p-6 rounded-xl shadow mt-6">

        <h2 className="text-xl font-bold mb-4">Pengujian</h2>
        <div className="mb-4">
  <input
    type="text"
    placeholder="Cari pengujian..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
  />
</div>
        <div className="flex gap-4 mb-4 text-sm">
  <div className="bg-gray-100 px-3 py-2 rounded">
    Total: <b>{total}</b>
  </div>

  <div className="bg-green-100 text-green-700 px-3 py-2 rounded">
    Done: <b>{done}</b>
  </div>

  <div className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded">
    Pending: <b>{pending}</b>
  </div>
</div>
<div className="flex gap-2 mb-4">
  {['All', 'Pending', 'In Progress', 'Done'].map((f) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className={`px-3 py-1 rounded text-sm ${
        filter === f
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300'
      }`}
    >
      {f}
    </button>
  ))}
</div>

        {/* ADD */}
        <div className="flex gap-2 mb-4">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Tambah pengujian..."
            className="border p-2 flex-1 rounded focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <button
            onClick={handleAddTask}
            className="bg-green-600 hover:bg-green-700 text-white px-4 rounded"
          >
            Tambah
          </button>
        </div>

        {/* LIST */}
        {tasks.length === 0 ? (
          <p className="text-gray-400">Belum ada pengujian</p>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((t) => {
              return (
                <div
                  key={t.id}
                  className="flex justify-between items-center border p-4 rounded-lg hover:shadow-md transition"
                >
                  {editingTaskId === t.id ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="border p-2 rounded w-1/2"
                      />

                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="border p-2 rounded"
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Done</option>
                      </select>

                      <button
                        onClick={handleSaveEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                      >
                        Simpan
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium">{t.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </div>

                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => startEdit(t)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}