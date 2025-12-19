import axios from 'axios';

// URL base del backend para la API
const API_URL = 'http://localhost:3000/api/v1';

// Función para iniciar sesión
export async function login(email: string, password: string) {
  // Se realiza la petición POST al endpoint de login
  const res = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });
  console.log('RAW LOGIN RESPONSE (res.data) --> ', res.data);

  return res.data;
}
