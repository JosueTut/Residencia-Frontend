import { apiClient } from './client';

export type UserRow = {
  id: number;
  name: string;
  email: string;
  rol:
    | 'SUB_ACADEMICA'
    | 'SUB_ADMINISTRATIVA'
    | 'PREFECTO'
    | 'RRHH'
    | 'DIRECTOR'
    | 'JEFE_CARRERA'
    | 'ROOT';
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  rol: UserRow['rol'];
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  rol?: UserRow['rol'];
  // 👇 si luego quieres permitir cambiar password desde aquí:
  // password?: string;
};

export async function getUsers(): Promise<UserRow[]> {
  const res = await apiClient.get('/api/v1/users');
  return res.data;
}

export async function createUser(payload: CreateUserPayload): Promise<UserRow> {
  const res = await apiClient.post('/api/v1/users', payload);
  return res.data;
}

// Actualizar usuario
export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<UserRow> {
  const res = await apiClient.patch(`/api/v1/users/${id}`, payload);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/users/${id}`);
}
