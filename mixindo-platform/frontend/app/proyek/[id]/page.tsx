'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');

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

  const handleUpdateStatus = async (taskId: string, status: string) => {
    await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    fetchData();
  };

  if (!project) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800">

      <button onClick={() => router.back()} className="mb-4 text-blue-600">
        ← Kembali
      </button>

      <h1 className="text-3xl font-bold text-blue-700">
        {project.name}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
            ID Proyek: 
            <span className="ml-2 font-mono text-blue-600">
            {project.id}
            </span>
            </p>

      {/* DETAIL */}
        <div className="flex gap-2 mb-4">
         <button
            onClick={() => router.push(`/proyek?edit=${project.id}`)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded"
          >
            ✏️ Edit
            </button>
        <button
         onClick={async () => {
            if (!confirm("Yakin hapus proyek ini?")) return;

      await fetch(`http://localhost:8000/api/v1/projects/${project.id}`, {
        method: 'DELETE'
      });
      router.push('/proyek');
    }}
    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
  >
    🗑️ Hapus
  </button>
</div>
        <p><b>Client:</b> {project.client_name}</p>
        <p><b>Status:</b> {project.status}</p>
        <p><b>Progress:</b> {project.progress}%</p>
        <p><b>Deskripsi:</b> {project.description || '-'}</p>

      {/* TASK SECTION */}
      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-bold mb-4">Task Proyek</h2>

        {/* ADD TASK */}
        <div className="flex gap-2 mb-4">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Tambah task baru..."
            className="border p-2 flex-1 rounded"
          />
          <button
            onClick={handleAddTask}
            className="bg-green-600 text-white px-4 rounded"
          >
            Tambah
          </button>
        </div>

        {/* LIST TASK */}
        {tasks.length === 0 ? (
          <p className="text-gray-400">Belum ada task</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex justify-between items-center border p-3 rounded">
                
                <span>{t.title}</span>

                <select
                  value={t.status}
                  onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                  className="border rounded p-1"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}