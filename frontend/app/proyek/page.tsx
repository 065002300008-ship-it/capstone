'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { alertSuccess, alertError, alertConfirm, toastSuccess } from '@/lib/alerts';
import { apiFetch, apiUrl } from '@/lib/api';

type MaterialTest = {
  id: string;
  material_no?: string | null;
  material_name: string;
  test_no?: number | null;
  test_name: string;
  display_no?: string | null;
};

const MATERIAL_RUNDOWN_OPTIONS: Record<string, string[]> = {
  'BASE A / B SUB-BASE': ['BASE A', 'BASE B', 'SUB BASE'],
  'BASE A / B / C SUB-BASE': ['BASE A', 'BASE B', 'BASE C', 'SUB BASE'],
  'SIRTU SIRDAM GRANULAR': ['BASE A', 'BASE B', 'BASE C', 'SUB BASE'],
  'BATU SPLITE': ['5-10 mm', '2-25', '10-20 mm', '10-25', '20-30 mm'],
  PASIR: ['5-10 mm', '2-25', '10-20 mm', '10-25', '20-30 mm'],
  'ABU BATU': ['5-10 mm', '2-25', '10-20 mm', '10-25', '20-30 mm'],
};

const normalizeMaterialName = (name: string) => name.trim().toUpperCase().replace(/\s+/g, ' ');
const getRundownOptionsForMaterial = (materialName: string) => {
  const normalized = normalizeMaterialName(materialName);
  if (normalized.includes('BASE A / B / C SUB-BASE')) return MATERIAL_RUNDOWN_OPTIONS['BASE A / B / C SUB-BASE'];
  if (normalized.includes('BASE A / B SUB-BASE')) return MATERIAL_RUNDOWN_OPTIONS['BASE A / B SUB-BASE'];
  if (normalized.includes('SIRTU SIRDAM GRANULAR')) return MATERIAL_RUNDOWN_OPTIONS['SIRTU SIRDAM GRANULAR'];
  if (normalized.includes('BATU SPLITE')) return MATERIAL_RUNDOWN_OPTIONS['BATU SPLITE'];
  if (normalized.includes('PASIR')) return MATERIAL_RUNDOWN_OPTIONS.PASIR;
  if (normalized.includes('ABU BATU')) return MATERIAL_RUNDOWN_OPTIONS['ABU BATU'];
  return null;
};

type FieldTestKey =
  | 'CBR'
  | 'SAND CONE'
  | 'DCP'
  | 'HAMMER TEST'
  | 'UPV TEST'
  | 'SONDIR BORING';

type FieldTestRow = {
  key: FieldTestKey;
  minPlaceholder?: string;
};

const FIELD_TEST_ROWS: FieldTestRow[] = [
  { key: 'CBR', minPlaceholder: 'min,6 titik' },
  { key: 'SAND CONE', minPlaceholder: 'min,5 titik' },
  { key: 'DCP', minPlaceholder: 'min,10 titik' },
  { key: 'HAMMER TEST', minPlaceholder: 'min,10 titik' },
  { key: 'UPV TEST', minPlaceholder: 'min,10 titik' },
  { key: 'SONDIR BORING' },
];

type FieldTestValue = {
  checked: boolean;
  minPoints: string;
  offer: string;
  existingTaskId?: string;
  existingStatus?: string;
  existingProgress?: number;
  existingDeadline?: string | null;
};

type Project = {
  id: string;
  project_code: string;
  name: string;
  description?: string | null;
  client_name?: string | null;
  start_date?: string | null;
  status: string;
  progress?: number | null;
};

type ProjectDetail = Project & {
  materialTests?: Array<{ id: string }>;
  fieldTests?: Array<{ key: string; min_points?: unknown; offer?: unknown }>;
};

export default function ProjectPage() {
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(''); // ✅ ID disimpan di sini
  const router = useRouter();
  const [statusParam, setStatusParam] = useState('');

  // ====== Material Test Picker (untuk Tambah Proyek) ======
  const [materialTests, setMaterialTests] = useState<MaterialTest[]>([]);
  const [checklistSearch, setChecklistSearch] = useState('');
  const [selectedMaterialTestIds, setSelectedMaterialTestIds] = useState<Set<string>>(new Set());
  const [selectedRundownByTestId, setSelectedRundownByTestId] = useState<Record<string, string>>({});
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [pickerMinimized, setPickerMinimized] = useState(false);
  const [fieldTests, setFieldTests] = useState<Record<FieldTestKey, FieldTestValue>>(() => {
    const initial: Record<FieldTestKey, FieldTestValue> = {} as Record<FieldTestKey, FieldTestValue>;
    for (const r of FIELD_TEST_ROWS) {
      initial[r.key] = { checked: false, minPoints: '', offer: '' };
    }
    return initial;
  });
  const [committedMaterialTaskByMaterialTestId, setCommittedMaterialTaskByMaterialTestId] = useState<
    Map<string, { taskId: string }>
  >(new Map());
  const [committedFieldTaskByKey, setCommittedFieldTaskByKey] = useState<Map<FieldTestKey, { taskId: string }>>(
    new Map()
  );
  const [committedPickerSnapshot, setCommittedPickerSnapshot] = useState<{
    materialIds: Set<string>;
    field: Record<FieldTestKey, { checked: boolean; minPoints: string; offer: string }>;
  }>(() => {
    const field: Record<FieldTestKey, { checked: boolean; minPoints: string; offer: string }> = {} as Record<
      FieldTestKey,
      { checked: boolean; minPoints: string; offer: string }
    >;
    for (const r of FIELD_TEST_ROWS) field[r.key] = { checked: false, minPoints: '', offer: '' };
    return { materialIds: new Set(), field };
  });

  const resetFieldTests = () => {
    setFieldTests(() => {
      const next: Record<FieldTestKey, FieldTestValue> = {} as Record<FieldTestKey, FieldTestValue>;
      for (const r of FIELD_TEST_ROWS) {
        next[r.key] = { checked: false, minPoints: '', offer: '' };
      }
      return next;
    });
  };

  useEffect(() => {
    try {
      const next = (new URLSearchParams(window.location.search).get('status') || '').trim();
      setStatusParam(next);
    } catch {
      setStatusParam('');
    }
  }, []);

  type ProjectForm = {
    name: string;
    description: string;
    client_name: string;
    start_date: string;
    status: string;
    progress: number;
  };

  const [baselineFormData, setBaselineFormData] = useState<ProjectForm>({
    name: '',
    description: '',
    client_name: '',
    start_date: '',
    status: '',
    progress: 0,
  });

  const [formData, setFormData] = useState<ProjectForm>({
    name: '',
    description: '',
    client_name: '',
    start_date: '',
    status: '',
    progress: 0,
  });

  const isFormDirty = useMemo(() => {
    const a = {
      name: (formData.name || '').trim(),
      description: (formData.description || '').trim(),
      client_name: (formData.client_name || '').trim(),
      start_date: (formData.start_date || '').trim(),
      status: (formData.status || '').trim(),
      progress: Number(formData.progress ?? 0),
    };
    const b = {
      name: (baselineFormData.name || '').trim(),
      description: (baselineFormData.description || '').trim(),
      client_name: (baselineFormData.client_name || '').trim(),
      start_date: (baselineFormData.start_date || '').trim(),
      status: (baselineFormData.status || '').trim(),
      progress: Number(baselineFormData.progress ?? 0),
    };
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [baselineFormData, formData]);

  const fetchProjects = async () => {
    try {
      const res = await apiFetch('/api/v1/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch error:", e);
      setProjects([]);
    }
  };

  useEffect(() => {
    setSelectedProjectIds(new Set());
  }, [projects]);

  const fetchMaterialTests = async () => {
    try {
      const res = await apiFetch('/api/v1/material-tests');
      const data = await res.json();
      setMaterialTests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch material-tests error:', e);
      setMaterialTests([]);
    }
  };

  const safeParseJson = (text: unknown): { min_points?: unknown; offer?: unknown } | null => {
    if (typeof text !== 'string') return null;
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === 'object') return parsed as { min_points?: unknown; offer?: unknown };
      return null;
    } catch {
      return null;
    }
  };

  const fetchProjectPickerState = async (projectId: string) => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        apiFetch(`/api/v1/projects/${projectId}`),
        apiFetch(`/api/v1/projects/${projectId}/tasks`),
      ]);

      const project = (await projectRes.json().catch(() => ({}))) as ProjectDetail;
      const tasksData = await tasksRes.json().catch(() => []);
      const tasks = Array.isArray(tasksData) ? tasksData : [];

      const materialTaskMap = new Map<string, { taskId: string }>();
      const fieldTaskMap = new Map<FieldTestKey, { taskId: string }>();

      for (const t of tasks) {
        const taskId = String(t?.id || '');
        const materialTestId = t?.material_test_id ? String(t.material_test_id) : null;
        const title = String(t?.title || '');
        if (materialTestId) {
          materialTaskMap.set(materialTestId, { taskId });
          continue;
        }
        if (title.startsWith('FIELD TEST:')) {
          const key = title.replace('FIELD TEST:', '').trim().toUpperCase() as FieldTestKey;
          if (!FIELD_TEST_ROWS.some((x) => x.key === key)) continue;
          fieldTaskMap.set(key, { taskId });
        }
      }

      const nextSelectedMaterialIds = new Set<string>(
        (project?.materialTests || []).map((x) => String(x?.id || '')).filter(Boolean)
      );

      const nextField: Record<FieldTestKey, FieldTestValue> = {} as Record<FieldTestKey, FieldTestValue>;
      for (const r of FIELD_TEST_ROWS) {
        nextField[r.key] = { checked: false, minPoints: '', offer: '' };
      }

      for (const ft of project?.fieldTests || []) {
        const key = String(ft?.key || '').trim().toUpperCase() as FieldTestKey;
        if (!FIELD_TEST_ROWS.some((x) => x.key === key)) continue;
        nextField[key] = {
          ...nextField[key],
          checked: true,
          minPoints: ft?.min_points != null ? String(ft.min_points) : '',
          offer: ft?.offer != null ? String(ft.offer) : '',
        };
      }

      // keep existing task metadata from server tasks list (progress/status/deadline + taskId)
      for (const t of tasks) {
        const taskId = String(t?.id || '');
        const title = String(t?.title || '');
        if (!title.startsWith('FIELD TEST:')) continue;
        const key = title.replace('FIELD TEST:', '').trim().toUpperCase() as FieldTestKey;
        if (!FIELD_TEST_ROWS.some((x) => x.key === key)) continue;
        const parsed = safeParseJson(t?.description);
        nextField[key] = {
          ...nextField[key],
          existingTaskId: taskId,
          existingStatus: String(t?.status || 'Pending'),
          existingProgress: Number.isFinite(Number(t?.progress)) ? Number(t.progress) : 0,
          existingDeadline: t?.deadline ? String(t.deadline) : null,
          // if project.fieldTests missing values, fall back to task description
          minPoints: nextField[key]?.minPoints || (parsed?.min_points != null ? String(parsed.min_points) : ''),
          offer: nextField[key]?.offer || (parsed?.offer != null ? String(parsed.offer) : ''),
        };
      }

      setCommittedMaterialTaskByMaterialTestId(materialTaskMap);
      setCommittedFieldTaskByKey(fieldTaskMap);
      setSelectedMaterialTestIds(nextSelectedMaterialIds);
      setFieldTests(nextField);
      setCommittedPickerSnapshot(() => {
        const snapField: Record<FieldTestKey, { checked: boolean; minPoints: string; offer: string }> = {} as Record<
          FieldTestKey,
          { checked: boolean; minPoints: string; offer: string }
        >;
        for (const r of FIELD_TEST_ROWS) {
          const v = nextField[r.key];
          snapField[r.key] = {
            checked: !!v?.checked,
            minPoints: (v?.minPoints || '').trim(),
            offer: (v?.offer || '').trim(),
          };
        }
        return {
          materialIds: new Set(Array.from(nextSelectedMaterialIds)),
          field: snapField,
        };
      });
    } catch (e) {
      console.error(e);
      alertError('Gagal Memuat', 'Gagal memuat history tabel pengujian proyek.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // TAMBAH
  const handleAddClick = () => {
    setIsEditMode(false);
    setSelectedId('');
    setAddStep(1);
    setPickerMinimized(false);
    setChecklistSearch('');
    setSelectedMaterialTestIds(new Set());
    resetFieldTests();
    setCommittedMaterialTaskByMaterialTestId(new Map());
    setCommittedFieldTaskByKey(new Map());
    setFormData({
      name: '',
      description: '',
      client_name: '',
      start_date: '',
      status: '',
      progress: 0,
    });
    setBaselineFormData({
      name: '',
      description: '',
      client_name: '',
      start_date: '',
      status: '',
      progress: 0,
    });
    setIsModalOpen(true);
    fetchMaterialTests();
  };

  // EDIT
  const handleEditClick = (project: Project) => {
    setIsEditMode(true);
    setSelectedId(project.id); // ✅ simpan ID di sini
    setAddStep(1);
    setPickerMinimized(false);
    setChecklistSearch('');
    setSelectedMaterialTestIds(new Set());
    resetFieldTests();
    setCommittedMaterialTaskByMaterialTestId(new Map());
    setCommittedFieldTaskByKey(new Map());

    setFormData({
      name: project.name || '',
      description: project.description || '',
      client_name: project.client_name || '',
      start_date: project.start_date || '',
      status: project.status || 'Planning',
      progress: project.progress || 0,
    });
    setBaselineFormData({
      name: project.name || '',
      description: project.description || '',
      client_name: project.client_name || '',
      start_date: project.start_date || '',
      status: project.status || 'Planning',
      progress: project.progress || 0,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAddStep(1);
    setPickerMinimized(false);
  };

  const handleGoToPicker = () => {
    setAddStep(2);
    setPickerMinimized(false);
    fetchMaterialTests();
    if (isEditMode && selectedId) {
      fetchProjectPickerState(selectedId);
    }
  };

  const handleCancelPickerEdit = () => {
    if (isEditMode && selectedId) {
      fetchProjectPickerState(selectedId);
    }
    setAddStep(1);
    setPickerMinimized(false);
  };

  const isPickerDirty = () => {
    const committedMaterialIds = committedPickerSnapshot.materialIds;
    if (committedMaterialIds.size !== selectedMaterialTestIds.size) return true;
    for (const id of selectedMaterialTestIds) {
      if (!committedMaterialIds.has(id)) return true;
    }

    for (const r of FIELD_TEST_ROWS) {
      const key = r.key;
      const committed = committedPickerSnapshot.field[key];
      const currentChecked = !!fieldTests[key]?.checked;
      if (committed.checked !== currentChecked) return true;
      const currentMin = (fieldTests[key]?.minPoints || '').trim();
      const currentOffer = (fieldTests[key]?.offer || '').trim();
      if ((committed.minPoints || '') !== currentMin) return true;
      if ((committed.offer || '') !== currentOffer) return true;
    }

    return false;
  };

  const createFieldTestTasksForProject = async (projectId: string) => {
    const selectedKeys = FIELD_TEST_ROWS.map((r) => r.key).filter((k) => fieldTests[k]?.checked);
    for (const key of selectedKeys) {
      const v = fieldTests[key];
      const description = JSON.stringify({
        min_points: v.minPoints || null,
        offer: v.offer || '',
      });
      // eslint-disable-next-line no-await-in-loop
      const taskRes = await apiFetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: `FIELD TEST: ${key}`,
          description,
          progress: 0,
          deadline: null,
        }),
      });
      const taskData = await taskRes.json().catch(() => ({}));
      if (!taskRes.ok) {
        alertError('Gagal', taskData.detail || 'Gagal menyimpan field test terpilih.');
        break;
      }
    }
  };

  const handleSavePickerEdit = async () => {
    if (!selectedId) return;

    const nextSelectedMaterialIds = selectedMaterialTestIds;
    const prevMaterialMap = committedMaterialTaskByMaterialTestId;

    const toRemoveMaterial = Array.from(prevMaterialMap.keys()).filter((id) => !nextSelectedMaterialIds.has(id));
    const toAddMaterial = Array.from(nextSelectedMaterialIds).filter((id) => !prevMaterialMap.has(id));

    const prevFieldMap = committedFieldTaskByKey;
    const toRemoveField: FieldTestKey[] = [];
    const toAddField: FieldTestKey[] = [];
    const toUpdateField: FieldTestKey[] = [];

    for (const r of FIELD_TEST_ROWS) {
      const key = r.key;
      const prevHas = prevFieldMap.has(key);
      const nextHas = !!fieldTests[key]?.checked;

      if (prevHas && !nextHas) toRemoveField.push(key);
      if (!prevHas && nextHas) toAddField.push(key);
      if (prevHas && nextHas) toUpdateField.push(key);
    }

    try {
      for (const materialTestId of toRemoveMaterial) {
        const existing = prevMaterialMap.get(materialTestId);
        if (!existing?.taskId) continue;
        // eslint-disable-next-line no-await-in-loop
        await apiFetch(`/api/v1/tasks/${existing.taskId}`, { method: 'DELETE' });
      }

      for (const materialTestId of toAddMaterial) {
        // eslint-disable-next-line no-await-in-loop
        const res = await apiFetch('/api/v1/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: selectedId,
            material_test_id: materialTestId,
            description: '',
            progress: 0,
            deadline: null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alertError('Gagal', data.detail || 'Terjadi kesalahan pada server.');
          return;
        }
      }

      for (const key of toRemoveField) {
        const existing = prevFieldMap.get(key);
        if (!existing?.taskId) continue;
        // eslint-disable-next-line no-await-in-loop
        await apiFetch(`/api/v1/tasks/${existing.taskId}`, { method: 'DELETE' });
      }

      for (const key of toAddField) {
        const v = fieldTests[key];
        const description = JSON.stringify({
          min_points: v.minPoints || null,
          offer: v.offer || '',
        });
        // eslint-disable-next-line no-await-in-loop
        const res = await apiFetch('/api/v1/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: selectedId,
            title: `FIELD TEST: ${key}`,
            description,
            progress: 0,
            deadline: null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alertError('Gagal', data.detail || 'Gagal menyimpan field test.');
          return;
        }
      }

      for (const key of toUpdateField) {
        const existing = prevFieldMap.get(key);
        if (!existing?.taskId) continue;
        const v = fieldTests[key];
        const description = JSON.stringify({
          min_points: v.minPoints || null,
          offer: v.offer || '',
        });
        // eslint-disable-next-line no-await-in-loop
        await apiFetch(`/api/v1/tasks/${existing.taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `FIELD TEST: ${key}`,
            description,
            progress: v.existingProgress ?? 0,
            deadline: v.existingDeadline || null,
            status: v.existingStatus || 'Pending',
          }),
        });
      }

      await alertSuccess('Berhasil', 'Tabel pengujian diperbarui');
      closeModal();
      fetchProjects();
    } catch (e) {
      console.error(e);
      alertError('Koneksi Gagal', 'Backend server tidak merespon.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && formData.status.trim() === '') {
      alertError('Validasi', 'Pilih status terlebih dahulu.');
      return;
    }

    const url = isEditMode
      ? apiUrl(`/api/v1/projects/${selectedId}`)
      : apiUrl('/api/v1/projects');

    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const payload = {
        ...formData,
        status: (formData.status || 'Planning').trim(),
      };

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // ✅ tidak ada ID
      });

      const data = await res.json();

      if (!res.ok) {
        alertError("Gagal Menyimpan", data.detail || "Terjadi kesalahan pada server");
        return;
      }

	      if (!isEditMode) {
	        const projectId = String(data?.id || '');
	        if (projectId && selectedMaterialTestIds.size > 0) {
	          for (const materialTestId of Array.from(selectedMaterialTestIds)) {
              const rundown = selectedRundownByTestId[materialTestId] || null;
            // eslint-disable-next-line no-await-in-loop
            const taskRes = await apiFetch('/api/v1/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: projectId,
                material_test_id: materialTestId,
                description: JSON.stringify({ rundown }),
                progress: 0,
                deadline: null,
              }),
            });
            const taskData = await taskRes.json().catch(() => ({}));
            if (!taskRes.ok) {
              alertError('Gagal', taskData.detail || 'Gagal menyimpan tabel pengujian terpilih.');
              break;
	            }
	          }
	        }
	        if (projectId) {
	          await createFieldTestTasksForProject(projectId);
	        }
	      }

      await alertSuccess(
        isEditMode ? "Proyek Diperbarui! 🔄" : "Proyek Berhasil Ditambahkan! ✨",
        `Proyek "${formData.name}" telah tersimpan.`
      );

      closeModal();
      fetchProjects();

    } catch {
      alertError("Koneksi Gagal", "Pastikan backend server berjalan di port 8000.");
    }
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    const result = await alertConfirm("Hapus Proyek?", `Hapus proyek "${projectName}"?`, "Ya, Hapus");
    if (!result.isConfirmed) return;

    try {
      const res = await apiFetch(`/api/v1/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();

      toastSuccess("Data berhasil dihapus");
      fetchProjects();
    } catch {
      alertError("Gagal Menghapus", "Terjadi kesalahan koneksi.");
    }
  };

  const toggleProjectSelection = (projectId: string, checked: boolean) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(projectId);
      else next.delete(projectId);
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    if (status === "Planning") return "bg-gray-200 text-gray-700";
    if (status === "In Progress") return "bg-blue-100 text-blue-700";
    if (status === "Completed") return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  const inputStyle = "w-full border p-2 rounded bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none";

  const checklistQuery = checklistSearch.trim().toLowerCase();
  const visibleMaterialTests = checklistQuery
    ? materialTests.filter((x) => {
        const material = (x.material_name || '').toLowerCase();
        const test = (x.test_name || '').toLowerCase();
        return material.includes(checklistQuery) || test.includes(checklistQuery);
      })
    : materialTests;

  const isSelected = (materialTestId: string) => selectedMaterialTestIds.has(materialTestId);

  const toggleOne = (materialTestId: string, nextChecked: boolean) => {
    setSelectedMaterialTestIds((prev) => {
      const next = new Set(prev);
      if (nextChecked) next.add(materialTestId);
      else next.delete(materialTestId);
      return next;
    });
  };

  const toggleMaterial = (materialName: string, nextChecked: boolean) => {
    const group = visibleMaterialTests.filter((x) => x.material_name === materialName);
    if (group.length === 0) return;

    setSelectedMaterialTestIds((prev) => {
      const next = new Set(prev);
      for (const x of group) {
        if (nextChecked) next.add(x.id);
        else next.delete(x.id);
      }
      return next;
    });
  };

  const getRundownLabel = (testId: string, materialName: string) => {
    return selectedRundownByTestId[testId] || getRundownOptionsForMaterial(materialName)?.[0] || '';
  };
  const setRundownLabel = (testId: string, label: string) => {
    setSelectedRundownByTestId((prev) => ({
      ...prev,
      [testId]: label,
    }));
  };

  const setFieldChecked = (key: FieldTestKey, checked: boolean) => {
    setFieldTests((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        checked,
      },
    }));
  };

  const setFieldMinPoints = (key: FieldTestKey, value: string) => {
    setFieldTests((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        minPoints: value,
      },
    }));
  };

  const setFieldOffer = (key: FieldTestKey, value: string) => {
    setFieldTests((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        offer: value,
      },
    }));
  };

  const filteredProjects = projects.filter((p) => {
    if (statusParam && (p.status || '') !== statusParam) return false;
    if (!search) return true;
    return (
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.project_code || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const visibleProjects = filteredProjects;
  const visibleProjectIds = visibleProjects.map((p) => p.id);
  const allVisibleSelected = visibleProjectIds.length > 0 && visibleProjectIds.every((id) => selectedProjectIds.has(id));
  const someVisibleSelected = visibleProjectIds.some((id) => selectedProjectIds.has(id));

  const toggleVisibleProjects = (checked: boolean) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleProjectIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleBulkDeleteProjects = async () => {
    const ids = Array.from(selectedProjectIds);
    if (ids.length === 0) return;

    const result = await alertConfirm(
      'Hapus banyak proyek?',
      `Hapus ${ids.length} proyek yang dipilih? Tindakan ini tidak bisa dibatalkan.`,
      'Ya, Hapus'
    );
    if (!result.isConfirmed) return;

    try {
      for (const projectId of ids) {
        const project = projects.find((p) => p.id === projectId);
        // eslint-disable-next-line no-await-in-loop
        const res = await apiFetch(`/api/v1/projects/${projectId}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alertError('Gagal Menghapus', data.detail || `Gagal menghapus proyek ${project?.name || projectId}.`);
          return;
        }
      }

      await alertSuccess('Berhasil', 'Proyek terpilih berhasil dihapus.');
      setSelectedProjectIds(new Set());
      fetchProjects();
    } catch (e) {
      console.error(e);
      alertError('Koneksi Gagal', 'Terjadi kesalahan koneksi.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 text-gray-800">

  {/* LEFT SIDE */}
    <div className="w-full">
    <h1 className="text-3xl font-bold text-blue-700">Daftar Proyek</h1>
    <p className="text-gray-500 text-sm mb-3">Kelola semua proyek Mixindo</p>

    <div className="mb-3 flex items-center gap-3">
      <button
        type="button"
        onClick={handleBulkDeleteProjects}
        disabled={selectedProjectIds.size === 0}
        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
          selectedProjectIds.size > 0
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        Hapus Terpilih
      </button>
      <span className="text-xs text-gray-500">
        {selectedProjectIds.size} proyek dipilih
      </span>
    </div>

    {statusParam ? (
      <div className="mb-3">
        <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
          Filter status: {statusParam}
          <button
            onClick={() => {
              setStatusParam('');
              router.push('/proyek');
            }}
            className="text-blue-700 hover:underline font-bold"
            aria-label="Hapus filter"
          >
            ✕
          </button>
        </span>
      </div>
    ) : null}

    {/* SEARCH */}
    <div className="w-full md:w-[400px]">
      <input
        type="text"
        placeholder="🔍 Cari nama proyek / kode proyek..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border px-4 py-2 rounded-xl shadow-sm 
                   focus:ring-2 focus:ring-blue-400 outline-none
                   transition-all duration-200"
      />
    </div>
  </div>

  {/* RIGHT SIDE */}
  <button
    onClick={handleAddClick}
    className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold shadow h-fit"
  >
    + Tambah Proyek
  </button>

</div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 font-semibold text-left">
            <tr>
              <th className="p-4 w-[60px]">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
                  }}
                  onChange={(e) => toggleVisibleProjects(e.target.checked)}
                  aria-label="Pilih semua proyek yang terlihat"
                />
              </th>
              <th className="p-4">ID</th>
              <th>Nama Proyek</th>
              <th>Client</th>
              <th>Status</th>
              <th>Progress</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
  {filteredProjects.length > 0 ? (
    filteredProjects.map((p) => (
      <tr key={p.id} className="border-b hover:bg-gray-50 text-gray-700">
        <td className="p-4">
          <input
            type="checkbox"
            checked={selectedProjectIds.has(p.id)}
            onChange={(e) => toggleProjectSelection(p.id, e.target.checked)}
            aria-label={`Pilih proyek ${p.name}`}
          />
        </td>
        
        <td className="p-4 text-blue-600 font-bold">
          {p.project_code}
        </td>

        <td
          className="font-medium text-blue-600 cursor-pointer hover:underline"
          onClick={() => router.push(`/proyek/${p.id}`)}
        >
          {p.name}
        </td>

        <td>{p.client_name}</td>

        <td>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(p.status)}`}>
            {p.status}
          </span>
        </td>

        <td className="w-[150px]">
          <div className="w-full bg-gray-200 h-2 rounded-full mb-1">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${p.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{p.progress}%</span>
        </td>

        <td className="p-4 align-top">
          <div className="grid grid-cols-2 gap-2 min-w-[260px]">
            <button
              onClick={() => router.push(`/proyek/${p.id}`)}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition text-white px-3 py-2 rounded-lg text-xs font-semibold w-full"
            >
              Detail
            </button>

            <button
              onClick={() => handleEditClick(p)}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 transition text-white px-3 py-2 rounded-lg text-xs font-semibold w-full"
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(p.id, p.name)}
              className="bg-red-500 hover:bg-red-600 active:scale-95 transition text-white px-3 py-2 rounded-lg text-xs font-semibold w-full"
            >
              Hapus
            </button>

            <button
              onClick={() => {
                window.open(apiUrl(`/api/v1/projects/${p.id}/report`), '_blank');
              }}
              className="bg-purple-600 hover:bg-purple-700 active:scale-95 transition text-white px-3 py-2 rounded-lg text-xs font-semibold w-full"
            >
              Download
            </button>

            <button
              onClick={() => {
                window.open(apiUrl(`/api/v1/projects/${p.id}/report?preview=1`), '_blank', 'noopener,noreferrer');
              }}
              className="col-span-2 bg-slate-600 hover:bg-slate-700 active:scale-95 transition text-white px-3 py-2 rounded-lg text-xs font-semibold w-full"
            >
              Preview
            </button>
          </div>
        </td>

      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={8} className="text-center p-6 text-gray-400 italic">
        🔍 Tidak ada proyek ditemukan
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 text-gray-800">
          <div
            className={`bg-white rounded-2xl w-full shadow-2xl relative overflow-hidden ${
              addStep === 2 ? 'max-w-6xl h-[85vh]' : 'max-w-lg'
            }`}
          >
            <div className="absolute top-3 right-3 flex items-center gap-3">
              {addStep === 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddStep(1);
                    setPickerMinimized(false);
                  }}
                  className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none"
                  aria-label="Minimize"
                  title="Minimize"
                >
                  –
                </button>
              ) : null}
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-red-500 text-xl font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-bold mb-4">
                {isEditMode
                  ? addStep === 1
                    ? 'Edit Proyek'
                    : 'Edit Proyek • Pilih Tabel Pengujian'
                  : addStep === 1
                    ? 'Tambah Proyek'
                    : 'Tambah Proyek • Pilih Tabel Pengujian'}
              </h2>

              {addStep === 1 ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Penerimaan</label>
                    <input
                      type="date"
                      placeholder="Tuliskan disini"
                      className={inputStyle}
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Client</label>
                    <input
                      placeholder="Tuliskan disini"
                      className={inputStyle}
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Proyek</label>
                    <input
                      placeholder="Tuliskan disini"
                      className={inputStyle}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label>
                    <textarea
                      placeholder="Tuliskan disini"
                      className={inputStyle}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      className={inputStyle}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="" disabled>
                        Pilih status
                      </option>
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {isEditMode ? (
                    <button
                      type="button"
                      onClick={handleGoToPicker}
                      className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded font-semibold text-left px-4"
                    >
                      Pilih Tabel Pengujian
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoToPicker}
                      className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded font-semibold text-left px-4"
                    >
                      Pilih Tabel Pengujian
                    </button>
                  )}

                  {isEditMode ? (
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          isFormDirty ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        className={`px-5 py-2 rounded-lg text-sm font-semibold ${
                          isFormDirty ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          isFormDirty ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-5 py-2 rounded-lg text-sm font-semibold ${
                          isFormDirty ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        Simpan Proyek
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between bg-gray-100 border rounded-xl px-4 py-3">
                    <div className="font-semibold text-gray-800">
                      Pilih Tabel Pengujian
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        ({selectedMaterialTestIds.size} dipilih)
                      </span>
                    </div>
                  </div>

                  {pickerMinimized ? null : (
                    <div className="mt-4 flex-1 min-h-0 flex flex-col">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <input
                            id="picker-search"
                            value={checklistSearch}
                            onChange={(e) => setChecklistSearch(e.target.value)}
                            placeholder="Cari Material/Tes"
                            className="border rounded-lg px-3 py-2 w-full md:w-96 bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-green-400 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('picker-search');
                              if (el instanceof HTMLInputElement) el.focus();
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                            aria-label="Cari"
                          >
                            Cari
                          </button>
                        </div>

                        <div />
                      </div>

	                      <div className="mt-4 flex-1 min-h-0 overflow-auto border rounded-xl p-4 bg-white">
	                        <div className="space-y-3">
	                          {materialTests.length === 0 ? (
	                            <p className="text-gray-400">Master Tes Material belum ada / belum bisa dimuat.</p>
	                          ) : null}

                          {Array.from(new Set(visibleMaterialTests.map((x) => x.material_name))).map((materialName) => {
	                            const group = visibleMaterialTests.filter((x) => x.material_name === materialName);
                            const normalizedMaterialName = normalizeMaterialName(materialName);
                            const isNoCheckboxMaterial =
                              normalizedMaterialName === 'PASIR ABU BATU' ||
                              normalizedMaterialName === 'PASIR' ||
                              normalizedMaterialName === 'ABU BATU';

	                            return (
	                              <div key={materialName} className="border rounded-lg p-4 bg-gray-50">
	                                <div className="flex items-center gap-2 font-semibold text-gray-800">
	                                  <span>{materialName}</span>
	                                  <span className="text-xs text-gray-500 font-normal">({group.length} tes)</span>
	                                </div>

	                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
	                                  {group.map((x) => {
	                                    const rundownOptions = getRundownOptionsForMaterial(materialName);
	                                    return (
	                                      <div key={x.id} className="flex items-start gap-2 text-sm bg-white border rounded p-2">
	                                        {isNoCheckboxMaterial ? null : (
	                                          <input
	                                            type="checkbox"
	                                            checked={isSelected(x.id)}
	                                            onChange={(e) => toggleOne(x.id, e.target.checked)}
	                                          />
	                                        )}
	                                        <div className="flex-1">
	                                          <div className="font-medium flex items-center gap-2 flex-wrap">
	                                            {x.display_no ? <span className="font-mono text-blue-700 mr-2">{x.display_no}</span> : null}
	                                            {x.test_name}
	                                            {rundownOptions ? (
	                                              <div className="relative inline-flex items-center">
	                                                <select
	                                                  value={getRundownLabel(x.id, materialName)}
	                                                  onChange={(e) => setRundownLabel(x.id, e.target.value)}
	                                                  className="h-6 max-w-[118px] rounded-md border border-gray-300 bg-white px-1 pr-5 text-[11px] font-medium text-gray-700 shadow-sm outline-none"
	                                                  aria-label={`Pilih rundown ${materialName} untuk ${x.test_name}`}
	                                                >
	                                                  {rundownOptions.map((opt) => (
	                                                    <option key={opt} value={opt}>
	                                                      {opt}
	                                                    </option>
	                                                  ))}
	                                                </select>
	                                                <span className="pointer-events-none absolute right-1 text-[10px] text-gray-500">v</span>
	                                              </div>
	                                            ) : null}
	                                          </div>
	                                        </div>
	                                      </div>
	                                    );
	                                  })}
	                                </div>
	                              </div>
	                            );
	                          })}

	                          {/* FIELD TEST (OPSIONAL) */}
	                          <div className="border rounded-lg p-4 bg-gray-50">
	                            <div className="flex items-center justify-between gap-3">
	                              <div className="font-semibold text-gray-800">Field Test (Opsional)</div>
	                              <div className="text-xs text-gray-500">Centang yang diperlukan lalu isi min titik/penawaran.</div>
	                            </div>

	                            <div className="mt-3 overflow-auto border rounded-lg bg-white">
	                              <table className="w-full text-sm">
	                                <thead className="bg-gray-100 text-gray-700 font-semibold text-left">
	                                  <tr>
	                                    <th className="p-3 w-[280px]">Field Test</th>
	                                    <th className="p-3 w-[220px]">Min Titik</th>
	                                    <th className="p-3">Penawaran</th>
	                                  </tr>
	                                </thead>
	                                <tbody>
	                                  {FIELD_TEST_ROWS.map((r) => {
	                                    const v = fieldTests[r.key];
	                                    const disabled = !v?.checked;
	                                    return (
	                                      <tr key={r.key} className="border-t text-gray-700">
	                                        <td className="p-3">
	                                          <label className="flex items-center gap-2 font-medium">
	                                            <input
	                                              type="checkbox"
	                                              checked={!!v?.checked}
	                                              onChange={(e) => setFieldChecked(r.key, e.target.checked)}
	                                            />
	                                            {r.key}
	                                          </label>
	                                        </td>
	                                        <td className="p-3">
	                                          <input
	                                            value={v?.minPoints || ''}
	                                            onChange={(e) => setFieldMinPoints(r.key, e.target.value)}
	                                            disabled={disabled}
	                                            placeholder={r.minPlaceholder || ''}
	                                            className={`w-full border rounded px-3 py-2 bg-white ${
	                                              disabled ? 'text-gray-400 bg-gray-50' : 'text-gray-800'
	                                            }`}
	                                          />
	                                        </td>
	                                        <td className="p-3">
	                                          <input
	                                            value={v?.offer || ''}
	                                            onChange={(e) => setFieldOffer(r.key, e.target.value)}
	                                            disabled={disabled}
	                                            placeholder="penawaran"
	                                            className={`w-full border rounded px-3 py-2 bg-white ${
	                                              disabled ? 'text-gray-400 bg-gray-50' : 'text-gray-800'
	                                            }`}
	                                          />
	                                        </td>
	                                      </tr>
	                                    );
	                                  })}
	                                </tbody>
	                              </table>
	                            </div>
	                          </div>
	                        </div>
	                      </div>

	                      <div className="mt-4 flex items-center gap-3">
	                        {isEditMode ? (
	                          <div className="flex items-center gap-2 ml-auto">
	                            {(() => {
	                              const dirty = isPickerDirty();
	                              return (
	                                <>
	                                  <button
	                                    type="button"
	                                    onClick={handleCancelPickerEdit}
	                                    disabled={!dirty}
	                                    className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
	                                      dirty
	                                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-200'
	                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
	                                    }`}
	                                  >
	                                    Cancel
	                                  </button>
	                                  <button
	                                    type="button"
	                                    onClick={() => (dirty ? handleSavePickerEdit() : null)}
	                                    disabled={!dirty}
	                                    className={`px-5 py-2 rounded-lg text-sm font-semibold ${
	                                      dirty
	                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
	                                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
	                                    }`}
	                                  >
	                                    Simpan Perubahan
	                                  </button>
	                                </>
	                              );
	                            })()}
	                          </div>
	                        ) : (
	                          <div className="flex items-center gap-2 ml-auto">
	                            <button
	                              type="button"
	                              onClick={() => setAddStep(1)}
	                              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
	                                selectedMaterialTestIds.size > 0
	                                  ? 'bg-red-600 hover:bg-red-700 text-white'
	                                  : 'bg-gray-200 text-gray-500'
	                              }`}
	                            >
	                              Kembali
	                            </button>
	                            <button
	                              type="button"
	                              onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
	                              disabled={selectedMaterialTestIds.size === 0}
	                              className={`px-5 py-2 rounded-lg text-sm font-semibold ${
	                                selectedMaterialTestIds.size > 0
	                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
	                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
	                              }`}
	                            >
	                              Simpan Proyek
	                            </button>
	                          </div>
	                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
