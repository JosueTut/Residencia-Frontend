// src/api/users.ts
import { apiClient } from './client';

export type UserRow = {
  id: number;
  name: string;
  email: string;
  rol: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  rol: string;
};

  // Obtener usuarios
  export async function getUsers(): Promise<UserRow[]> {
    const res = await apiClient.get('/api/v1/users');
    const data = res.data;

    // Ajusta el mapeo si tu backend usa otros nombres
    return (Array.isArray(data) ? data : []).map((u: any) => ({
      id: u.id ?? u.sub ?? u.id_user ?? u.id_usuario,
      name: u.name ?? u.nombre ?? '',
      email: u.email ?? '',
      rol: String(u.rol ?? u.role ?? '').toUpperCase().trim(),
    }));
  }

  // Obtener usuarios
  export async function createUser(payload: CreateUserPayload): Promise<UserRow> {
    const res = await apiClient.post('/api/v1/users', payload);
    const u = res.data;

    return {
      id: u.id ?? u.sub ?? u.id_user ?? u.id_usuario,
      name: u.name ?? u.nombre ?? payload.name,
      email: u.email ?? payload.email,
      rol: String(u.rol ?? u.role ?? payload.rol).toUpperCase().trim(),
    };
  }

  // Eliminar usuario
  export async function deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/users/${id}`);
  }
