import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

// Layout principal de la aplicación
export const AppLayout = () => {
  return (
    // Contenedor principal con layout horizontal
    <div style={{ display: 'flex', minHeight: '100vh', background: '#111' }}>
      {/* Barra lateral de navegación */}
      <Sidebar />
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
};
