import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { canAccess } from '../auth/permissions';

// Define todas las rutas disponibles en el sistema
const ITEMS = [
  { label: 'Home', path: '/home' },
  { label: 'Perfil', path: '/profile' },
  { label: 'Asignación de horarios', path: '/horarios' },
  { label: 'Pase de lista', path: '/pase-lista' },
  { label: 'Modificación de Asistencias', path: '/asistencias' },
  { label: 'Generador de Reportes', path: '/reporte' },
  { label: 'Docentes', path: '/docentes' },
  { label: 'Administrador de roles', path: '/admin' },
];

  // Botón de cerrar sesión
  export const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

  // Verifica si el rol del usuario puede acceder a la ruta
  const go = (path: string) => {
    const ok = canAccess(path, user?.rol);
    if (!ok) {
      // Regresa al home
      navigate('/home', { replace: true, state: { noAccessFrom: path } });
      return;
    }
    navigate(path);
  };

  return (
    <aside
      style={{
        width: 260,
        background: '#151515',
        color: 'white',
        padding: 16,
        borderRight: '1px solid #2a2a2a',
        minHeight: '100vh',
      }}
    >
      {/* Información del usuario */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Residencia</div>
        <div style={{ opacity: 0.8, fontSize: 13 }}>
          {user?.name} · {user?.rol}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {ITEMS.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 8,
                background: active ? '#222' : 'transparent',
                color: 'white',
                border: '1px solid #2a2a2a',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Botón de cerrar sesión */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #2a2a2a' }}>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            background: '#2a0f0f',
            color: 'white',
            border: '1px solid #4a1a1a',
            cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};
