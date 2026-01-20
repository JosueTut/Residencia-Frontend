import { apiClient } from './client';

export type Carrera = {
  idCarrera: number;
  nombre: string;
};

export const getCarreras = async (): Promise<Carrera[]> => {
  const { data } = await apiClient.get('/api/v1/carreras');
  return Array.isArray(data) ? data : [];
};

export const createCarrera = async (payload: { nombre: string }) => {
  const { data } = await apiClient.post('/api/v1/carreras', payload);
  return data;
};

export const updateCarrera = async (id: number, payload: { nombre: string }) => {
  const { data } = await apiClient.put(`/api/v1/carreras/${id}`, payload);
  return data;
};

export const deleteCarrera = async (id: number) => {
  const { data } = await apiClient.delete(`/api/v1/carreras/${id}`);
  return data;
};
