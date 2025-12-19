import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { login as loginRequest } from '../api/auth';

type User = {
  id: number;
  name: string;
  email: string;
  rol: string; // ej: "RRHH", "PREFECTO", "ROOT"
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

// Creación del contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Función para normalizar roles
function normalizeRole(input: unknown): string {
  return String(input ?? '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '_');
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Recuperar sesión al recargar la página
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;

        // Validación mínima para evitar estados raros
        if (parsed && parsed.id && parsed.email && parsed.rol) {
          setToken(savedToken);
          setUser(parsed);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Error parsing saved user', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // Función Login
  const handleLogin = async (email: string, password: string) => {
    const data = await loginRequest(email, password);

    console.log('RESPUESTA LOGIN (data) --> ', data);

    // Backend manda { token, user: {...} }
    const tokenFromApi = (data as any)?.token;
    const backendUser = (data as any)?.user;

    if (!tokenFromApi || !backendUser) {
      console.error('Respuesta de login inesperada:', data);
      throw new Error('Login response invalid');
    }

    // Normaliza keys (por si vienen distinto)
    const id =
      backendUser.id ??
      backendUser.sub ?? // JWT payload típico
      backendUser.userId;

    const emailFromApi = backendUser.email;
    const nameFromApi =
      backendUser.name ??
      backendUser.nombre ??
      backendUser.username ??
      emailFromApi;

    const rolFromApi =
      backendUser.rol ?? backendUser.role ?? backendUser.ROLE;

    const normalizedUser: User = {
      id: Number(id),
      name: String(nameFromApi),
      email: String(emailFromApi),
      rol: normalizeRole(rolFromApi),
    };

    if (!normalizedUser.id || !normalizedUser.email || !normalizedUser.rol) {
      console.error('Usuario incompleto después de normalizar:', normalizedUser);
      throw new Error('User data invalid');
    }

    // Guardar sesión
    setToken(tokenFromApi);
    setUser(normalizedUser);

    localStorage.setItem('token', tokenFromApi);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  // Función Logout
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login: handleLogin, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
