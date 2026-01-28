# Residencia - Frontend (Web)
Sistema para la supervisión de la asistencia del docente en el aula (TecNM Campus Cancún).

Este repositorio contiene el frontend web desarrollado con React + Vite. La interfaz permite iniciar sesión, consultar información por fecha, visualizar historial, generar reportes y ejecutar acciones según el rol del usuario (por ejemplo, correcciones controladas).

---

## Tecnologías
- React
- Vite
- TypeScript (si aplica en el proyecto)
- (UI) Tailwind (si aplica en el proyecto)

---

## Requisitos previos
- Git
- Node.js (recomendado: 18+)
- Backend corriendo (ver repo del backend)
  - Por defecto: http://localhost:3000

---

## 1) Clonar el repositorio
```bash
git clone https://github.com/JosueTut/Residencia-Frontend.git
cd Residencia-Frontend
```

## 2) Instalar dependencias

```bash
npm install

```

## 3) Ejecutar el frontend

```bash
npm run dev
```

Vite normalmente levanta en:

http://localhost:5173

Build (producción)

```bash
npm run build
npm run preview
```

---

Flujo funcional (alto nivel)

- Login: obtiene token JWT desde el backend.
- Operación por fecha: consulta/visualiza información según endpoints del backend.
- Acciones por rol: Roles administrativos (consulta y reportes), Roles autorizados (correcciones según permisos)
- Reportes: por fecha y por rango
- Exportación: PDF / Excel / CSV

--- 

Conexión con el Backend

Asegurarse de:

- Backend corriendo en http://localhost:3000
- MySQL activo (Docker) y backend conectado correctamente
- Usuario válido en la BD para poder iniciar sesión

--- 

Estructura general

- public/: archivos estáticos
- src/: componentes, vistas y lógica de consumo de API

---

Documentación de código

El proyecto mantiene comentarios dentro de los archivos para explicar:

- Componentes principales
- Pantallas/vistas
- Consumo de endpoints
- Manejo de sesión/token