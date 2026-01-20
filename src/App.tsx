import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { PrivateRoute } from './routes/PrivateRoute';
import { AsignacionHorariosPage } from './pages/AsignacionHorariosPage';
import { RegistroAsistenciasPage } from './pages/RegistroAsistencias';
import { UserprofilePage } from './pages/UserProfile';
import { PaseListaPage } from './pages/PaseListaPage';
import { ReporteAsistenciasPage } from './pages/ReporteAsistenciasPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { RoleRoute } from './routes/RoleRoute';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { DocentesPage } from './pages/DocentesPage';
import { EdificiosPage } from './pages/EdificiosPage';
import { CarrerasPage } from './pages/CarrerasPage';

export function App() {
  return (
    <Routes>
      {/* Ruta raíz: si alguien entra a "/", se redirige al login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas públicas (no requieren sesión) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Rutas privadas (requieren login) */}
      <Route element={<PrivateRoute />}>

        {/* Layout general de la app*/}
        <Route element={<AppLayout />}>

          {/* Rutas para usuarios autenticados */}
          <Route
            element={
              <RoleRoute
                // El allowed lista los roles que pueden acceder a estas páginas
                allowed={[
                  'SUB_ACADEMICA',
                  'SUB_ADMINISTRATIVA',
                  'PREFECTO',
                  'RRHH',
                  'DIRECTOR',
                  'JEFE_CARRERA',
                  'ROOT',
                ]}
              />
            }
          >
            {/* accesible para cualquier usuario autenticado */}
            <Route path="/home" element={<HomePage />} />

            {/* Perfil del usuario */}
            <Route path="/profile" element={<UserprofilePage />} />

            {/* Consulta de asistencias */}
            <Route path="/asistencias" element={<RegistroAsistenciasPage />} />

            {/* Reporte de asistencias */}
            <Route path="/reporte" element={<ReporteAsistenciasPage />} />
          </Route>

          {/* Pase de lista, Solo para PREFECTO y ROOT */}
          <Route element={<RoleRoute allowed={['PREFECTO', 'ROOT']} />}>
            <Route path="/pase-lista" element={<PaseListaPage />} />
          </Route>

          {/* Horarios, Solo RRHH, DIRECTOR, JEFE DE CARRERA y ROOT */}
          <Route element={<RoleRoute allowed={['RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT']} />}>
            <Route path="/horarios" element={<AsignacionHorariosPage />} />
          </Route>

          {/* Administración de Usuarios, Solo RRHH, DIRECTOR y ROOT */}
          <Route element={<RoleRoute allowed={['RRHH', 'DIRECTOR', 'ROOT']} />}>
            <Route path="/admin" element={<AdminUsersPage />} />
          </Route>

          {/* CRUD de Docentes, Solo RRHH, DIRECTOR, JEFE DE CARRERA y ROOT */}
          <Route element={<RoleRoute allowed={['RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT']} />}>
            <Route path="/docentes" element={<DocentesPage />} />
          </Route>

          {/* CRUD de Edificios y Salones, Solo RRHH, DIRECTOR, JEFE DE CARRERA y ROOT */}
          <Route element={<RoleRoute allowed={['RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT']} />}>
            <Route path="/edificios" element={<EdificiosPage />} />
          </Route>

          <Route element={<RoleRoute allowed={['RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT']} />}>
            <Route path="/carreras" element={<CarrerasPage />} />
          </Route>
        </Route>

      </Route>

      {/* Ruta comodín: cualquier ruta no existente redirige al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
