// src/api/horarios.ts
import { apiClient } from './client';

export interface Horario {
  id: number;
  docente: {
    id: number;
    nombre: string;
    carrera: string;
  };
  dia_semana: string;
  hora_clase: string;
  aula?: string;
  edificio?: string;
}

export type CreateHorarioPayload = {
  id_docente: number;
  dia_semana: string;
  hora_clase: string;
  aula?: string;
  edificio?: string;
};

// Mapeo backend -> frontend
function mapHorario(h: any): Horario {
  const docente = h.docente; // lo que manda el backend

  return {
    id: h.id_horario,
    docente: docente
      ? {
          id: docente.id_docente,
          nombre: docente.nombre,
          carrera: docente.carrera,
        }
      : {
          id: 0,
          nombre: 'Sin profesor',
          carrera: '',
        },
    dia_semana: h.dia_semana,
    hora_clase: h.hora_clase,
    aula: h.aula,
    edificio: h.edificio,
  };
}

  // Obtener Horarios 
  export async function getHorarios(): Promise<Horario[]> {
    const res = await apiClient.get('/api/v1/horarios');
    const data = res.data;
    return data.map(mapHorario);
  }

  // Crear Horarios
  export async function createHorario(payload: CreateHorarioPayload): Promise<Horario> {
    const res = await apiClient.post('/api/v1/horarios', payload);
    return mapHorario(res.data);
  }

  // Eliminar Horarios
  export async function deleteHorario(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/horarios/${id}`);
  }
