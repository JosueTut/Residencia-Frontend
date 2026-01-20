import { apiClient } from './client';

// enum frontend
export type TipoDocente = 'BASE' | 'HORAS';

export type Docente = {
  id_docente: number;
  nombre: string;
  carrera: string;
  activo: boolean;
  tipo: TipoDocente;
};

export type CreateDocentePayload = {
  nombre: string;
  carrera: string;
  activo?: boolean;
  tipo: TipoDocente;
};

export type UpdateDocentePayload = {
  nombre?: string;
  carrera?: string;
  activo?: boolean;
  tipo?: TipoDocente;
};

// Obtener docentes
export async function getDocentes(): Promise<Docente[]> {
  const res = await apiClient.get('/api/v1/docentes');
  return res.data;
}

// Crear docente
export async function createDocente(payload: CreateDocentePayload): Promise<Docente> {
  const res = await apiClient.post('/api/v1/docentes', payload);
  return res.data;
}

// ✅ NUEVO: actualizar nombre/carrera (PATCH /api/v1/docentes/:id)
export async function updateDocente(id: number, payload: UpdateDocentePayload): Promise<Docente> {
  const res = await apiClient.patch(`/api/v1/docentes/${id}`, payload);
  return res.data;
}

// Cambiar estado activo/inactivo
export const updateDocenteEstado = async (id: number, activo: boolean) => {
  const res = await apiClient.patch(`/api/v1/docentes/${id}`, { activo });
  return res.data;
};

// Cambiar tipo BASE/HORAS
export async function updateDocenteTipo(id: number, tipo: TipoDocente): Promise<Docente> {
  const res = await apiClient.patch(`/api/v1/docentes/${id}/tipo`, { tipo });
  return res.data;
}

// Eliminar docente
export async function deleteDocente(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/docentes/${id}`);
}
