import { apiClient } from './client';

export type Horario = {
  id: number;
  dia_semana: string;
  hora_clase: string;
  edificio?: string | null;
  aula?: string | null;
  id_docente: number;

  docente?: {
    id_docente: number;
    nombre: string;
    carrera: string;
    activo: boolean;
    tipo: 'BASE' | 'HORAS';
  };
};

export type CreateHorarioPayload = {
  id_docente: number;
  dia_semana: string;
  hora_clase: string;
  edificio?: string;
  aula?: string;
};

export type UpdateHorarioPayload = Partial<CreateHorarioPayload>;

export async function getHorarios(): Promise<Horario[]> {
  const res = await apiClient.get('/api/v1/horarios');
  return res.data;
}

export async function createHorario(payload: CreateHorarioPayload): Promise<Horario> {
  const res = await apiClient.post('/api/v1/horarios', payload);
  return res.data;
}

export async function updateHorario(id: number, payload: UpdateHorarioPayload): Promise<Horario> {
  const res = await apiClient.patch(`/api/v1/horarios/${id}`, payload);
  return res.data;
}

export async function deleteHorario(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/horarios/${id}`);
}
