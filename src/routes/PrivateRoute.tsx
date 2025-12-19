import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContext';

// Protege rutas privadas
export const PrivateRoute = () => {
  // Se obtiene el usuario y el estado de carga desde el contexto de autenticación
  const { user, loading } = useAuth();
  // Log útil durante desarrollo para depuración
  console.log('PrivateRoute -> loading:', loading, 'user:', user);

  if (loading) return <p>Cargando...</p>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario está autenticado, permite renderizar la ruta solicitada
  return <Outlet />;
};
