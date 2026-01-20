// src/api/asistencias.ts
import { apiClient } from './client';

export type PaseListaItem = {
  idHorario: number;
  profesor: string;
  carrera: string;
  salon: string;
  edificio: string;
  diaSemana: string;
  horaClase: string;

  // ✅ nuevos para UX
  bloqueado?: boolean;
  motivoBloqueo?: string | null;
  idAsistenciaExistente?: number | null;

  // ✅ existentes (pueden venir nulos)
  estado?: EstadoAsistencia | null;
  notaAdicional?: string | null;
  horaRegistro?: string | null;
};

export interface AsistenciaItem {
  idAsistencia: number;
  idHorario: number;
  profesor: string;
  carrera: string;
  edificio: string;
  salon: string;
  horaClase: string;
  estado: string;
  nota?: string;
}

export type AsistenciaRangoItem = {
  idAsistencia: number;
  fecha: string;
  estado: string;
  notaAdicional?: string;

  idHorario: number;
  profesor: string;
  carrera?: string;
  edificio?: string;
  salon?: string;
  horaClase?: string;
  diaSemana?: string;
};

export type AsistenciaRow = {
  idAsistencia: number;
  idHorario: number;
  fecha: string;
  profesor: string;
  carrera: string;
  edificio: string;
  salon: string;
  horaClase: string;
  estado: string; // 'PRESENTE' | 'AUSENTE' | etc
  nota: string;
};

export type ReporteAsistenciaItem = {
  idAsistencia: number;
  fecha: string;
  horaRegistro?: string | null;
  estado: string;
  notaAdicional?: string | null;

  profesor: string;
  carrera?: string;
  edificio?: string;
  salon?: string;
  horaClase?: string;
  diaSemana?: string;
};

export type EstadoAsistencia =
  | 'PRESENTE'
  | 'AUSENTE'
  | 'RETARDO'
  | 'INCAPACIDAD'
  | 'COMISION';

// Obtener pase de lista por fecha
export async function getPaseLista(fecha: string): Promise<PaseListaItem[]> {
  const res = await apiClient.get('/api/v1/asistencias/pase-lista', {
    params: { fecha },
  });
  // Aseguramos que siempre sea arreglo (evita "map is not a function")
  return Array.isArray(res.data) ? res.data : [];
}

// Obtener reporte por fecha (si lo usas)
export async function getReporteAsistencias(fecha: string): Promise<ReporteAsistenciaItem[]> {
  const res = await apiClient.get('/api/v1/asistencias/reporte', { params: { fecha } });
  return Array.isArray(res.data) ? res.data : [];
}

// Guardar pase de lista
export async function guardarPaseLista(payload: {
  fecha: string;
  registros: Array<{
    idHorario: number;
    estado: EstadoAsistencia;
    notaAdicional?: string;
  }>;
}) {
  const res = await apiClient.post('/api/v1/asistencias/pase-lista', payload);
  return res.data;
}

// Consultar asistencias ya tomadas por fecha
export async function getAsistenciasPorFecha(fecha: string): Promise<AsistenciaRow[]> {
  const res = await apiClient.get('/api/v1/asistencias', { params: { fecha } });
  return res.data;
}

export async function getAsistenciasPorRango(fechaInicio: string, fechaFin: string) {
  const res = await apiClient.get('/api/v1/asistencias/rango', {
    params: { fechaInicio, fechaFin },
  });
  return res.data;
}

// Actualizar una asistencia
export async function updateAsistencia(
  idAsistencia: number,
  payload: { estado?: string; notaAdicional?: string },
) {
  const res = await apiClient.patch(`/api/v1/asistencias/${idAsistencia}`, payload);
  return res.data;
}
