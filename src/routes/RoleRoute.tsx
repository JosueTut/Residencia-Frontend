import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';

// Props del componente: lista de roles permitidos
type Props = {
  allowed: string[];
};

// Convierte a mayúsculas, elimina espacios y unifica formato
const normalizeRole = (rol: unknown) =>
  String(rol ?? '').toUpperCase().trim().replace(/\s+/g, '_');

export const RoleRoute = ({ allowed }: Props) => {
  // Se obtiene el usuario autenticado y el estado de carga
  const { user, loading } = useAuth();
  // Se obtiene la ruta actual
  const location = useLocation();

  if (loading)
    return <p style={{ padding: 24, color: 'white' }}>Cargando...</p>;

  if (!user) return <Navigate to="/login" replace />;

  const rol = normalizeRole(user.rol);

  // El rol ROOT tiene acceso total
  if (rol === 'ROOT') return <Outlet />;

  // Si el rol del usuario no está permitido para esta ruta
  // Se redirige al Home (en lugar de mostrar error)
  if (!allowed.includes(rol)) {
    return (
      <Navigate
        to="/home"
        replace
        state={{ noAccessFrom: location.pathname }}
      />
    );
  }
  
  return <Outlet />;
};
