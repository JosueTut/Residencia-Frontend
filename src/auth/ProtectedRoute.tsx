import { Navigate, useLocation } from 'react-router-dom';
import { ROUTE_PERMISSIONS } from './permissions';
import { useAuth } from '../context/authContext'; 
import type { JSX } from 'react';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  // Se obtiene el usuario autenticado y el estado de carga
  const { user, loading } = useAuth();

  // Se obtiene la ruta actual para consultar permisos
  const location = useLocation();
  if (loading) return <p style={{ padding: 24, color: 'white' }}>Cargando...</p>;

  // Si no hay usuario autenticado, se redirige al login
  if (!user) return <Navigate to="/login" replace />;

  // Se consulta qué roles tienen permitido acceder a la ruta actual
  const allowed = ROUTE_PERMISSIONS[location.pathname];
  if (!allowed) return <Navigate to="/forbidden" replace />;
  
  // El rol ROOT tiene acceso total
  if (user.rol === 'ROOT') return children;
  if (!allowed.includes(user.rol)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return children;
};
