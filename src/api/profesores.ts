import { apiClient } from './client';

  export type Docente = {
    id_docente: number;
    nombre: string;
    carrera: string;
  };
  // Define los datos mínimos para crear un docente
  export type CreateDocentePayload = {
    nombre: string;
    carrera: string;
  };

  // Obtener docentes
  export async function getDocentes(): Promise<Docente[]> {
    const res = await apiClient.get('/api/v1/docentes');
    return res.data;
  }

  // Crear Docentes
  export async function createDocente(payload: CreateDocentePayload): Promise<Docente> {
    const res = await apiClient.post('/api/v1/docentes', payload);
    return res.data;
  }

  // Eliminar Docentes
  export async function deleteDocente(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/docentes/${id}`);
  }
