import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const closeSidebar = () => setSidebarOpen(false);

  // ✅ Cierra sidebar al cambiar de ruta (móvil)
  useEffect(() => {
    closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {/* Sidebar (responsivo) */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <main className="app-main">
        {/* Header móvil */}
        <div className="app-topbar">
          <button
            type="button"
            className="topbar-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <div className="topbar-title">
            {(() => {
              const p = location.pathname;
              if (p.startsWith('/home')) return 'Home';
              if (p.startsWith('/profile')) return 'Perfil';
              if (p.startsWith('/horarios')) return 'Horarios';
              if (p.startsWith('/pase-lista')) return 'Pase de lista';
              if (p.startsWith('/asistencias')) return 'Asistencias';
              if (p.startsWith('/reporte')) return 'Reportes';
              if (p.startsWith('/docentes')) return 'Docentes';
              if (p.startsWith('/edificios')) return 'Edificios';
              if (p.startsWith('/carreras')) return 'Carreras';
              if (p.startsWith('/admin')) return 'Usuarios';
              return 'Residencia';
            })()}
          </div>
        </div>

        <div className="app-main__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
