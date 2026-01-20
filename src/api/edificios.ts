import { apiClient } from './client';

export type Salon = {
  id: number;
  nombre: string;
  edificioId: number;
};

export type Edificio = {
  id: number;
  nombre: string;
  salones?: Salon[];
};

export const getEdificios = async (): Promise<Edificio[]> => {
  const { data } = await apiClient.get('/api/v1/edificios');
  return data;
};

export const createEdificio = async (payload: { nombre: string }) => {
  const { data } = await apiClient.post('/api/v1/edificios', payload);
  return data as Edificio;
};

export const updateEdificio = async (id: number, payload: { nombre: string }) => {
  const { data } = await apiClient.patch(`/api/v1/edificios/${id}`, payload);
  return data as Edificio;
};

export const deleteEdificio = async (id: number) => {
  const { data } = await apiClient.delete(`/api/v1/edificios/${id}`);
  return data;
};

export const addSalon = async (edificioId: number, payload: { nombre: string }) => {
  const { data } = await apiClient.post(`/api/v1/edificios/${edificioId}/salones`, payload);
  return data as Salon;
};

export const updateSalon = async (salonId: number, payload: { nombre: string }) => {
  const { data } = await apiClient.patch(`/api/v1/edificios/salones/${salonId}`, payload);
  return data as Salon;
};

export const deleteSalon = async (salonId: number) => {
  const { data } = await apiClient.delete(`/api/v1/edificios/salones/${salonId}`);
  return data;
};
