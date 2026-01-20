export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/profile': ['SUB_ACADEMICA', 'SUB_ADMINISTRATIVA', 'PREFECTO', 'RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT'],
  '/asistencias': ['SUB_ACADEMICA', 'SUB_ADMINISTRATIVA', 'PREFECTO', 'RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT'],
  '/reporte': ['SUB_ACADEMICA', 'SUB_ADMINISTRATIVA', 'PREFECTO', 'RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT'],
  '/pase-lista': ['PREFECTO', 'ROOT'],
  '/admin': ['RRHH', 'DIRECTOR', 'ROOT'],
  '/horarios': ['RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT'],
  '/docentes': ['RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT'],
  '/edificios': ['RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT'],
  '/carreras': ['RRHH', 'DIRECTOR', 'JEFE_CARRERA', 'ROOT'],
};

  function normalizePath(pathname: string) {
    // quita query/hash y reduce a ruta base
    const clean = pathname.split('?')[0].split('#')[0];

    // Intenta encontrar la mejor coincidencia, Para priorizar rutas más específicas
    const keys = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
    const match = keys.find(k => clean === k || clean.startsWith(k + '/'));
    return match ?? clean;
  }

  // Función principal para validar acceso.
  export function canAccess(pathname: string, rol?: string | null) {
    if (!rol) return false;
    if (rol === 'ROOT') return true;

    const normalized = normalizePath(pathname);
    const allowed = ROUTE_PERMISSIONS[normalized];

    if (!allowed) return false;
    return allowed.includes(rol);
  }
