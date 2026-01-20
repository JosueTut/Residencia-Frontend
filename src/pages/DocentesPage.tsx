import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createDocente,
  deleteDocente,
  getDocentes,
  updateDocente,
  updateDocenteEstado,
  updateDocenteTipo,
  type Docente,
  type TipoDocente,
} from '../api/profesores';
import { getCarreras, type Carrera } from '../api/carreras';

/* ===============================
   Icons (SVG inline)
================================ */
const Icon = ({
  name,
}: {
  name:
    | 'cap'
    | 'filter'
    | 'user'
    | 'book'
    | 'toggle'
    | 'trash'
    | 'reload'
    | 'save'
    | 'list'
    | 'checkCircle'
    | 'xCircle';
}) => {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'cap':
      return (
        <svg {...common}>
          <path d="M22 10L12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...common}>
          <path d="M3 5h18" />
          <path d="M6 5l6 7v6l4 2v-8l5-7" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 19a2 2 0 0 1 2-2h14" />
          <path d="M6 3h14v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case 'toggle':
      return (
        <svg {...common}>
          <rect x="2" y="7" width="20" height="10" rx="5" />
          <circle cx="9" cy="12" r="2" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      );
    case 'reload':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v6h-6" />
        </svg>
      );
    case 'save':
      return (
        <svg {...common}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
          <path d="M17 21v-8H7v8" />
          <path d="M7 3v5h8" />
        </svg>
      );
    case 'list':
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case 'checkCircle':
      return (
        <svg {...common}>
          <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
          <path d="M16 8l-5.5 6L8 11.5" />
        </svg>
      );
    case 'xCircle':
      return (
        <svg {...common}>
          <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      );
    default:
      return null;
  }
};

/* ===============================
   Styles (match your new UI)
================================ */
const S = {
  screen: {
    minHeight: '100vh',
    background: '#f6f8fc',
    padding: '18px 0 60px',
    color: '#0f172a',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  } as const,

  page: {
    width: '100%',
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 24px',
  } as const,

  hero: {
    borderRadius: 18,
    padding: 22,
    color: '#fff',
    boxShadow: '0 16px 45px rgba(2,6,23,.15)',
    background: 'linear-gradient(180deg, #1d4ed8 0%, #3b82f6 100%)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  } as const,

  heroRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap' as const,
  } as const,

  heroLeft: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 280 } as const,

  heroIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 999,
    background: 'rgba(255,255,255,.16)',
    display: 'grid',
    placeItems: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)',
  } as const,

  h1: { margin: 0, fontSize: 34, letterSpacing: -0.7, lineHeight: 1.05, fontWeight: 550 } as const,
  sub: { margin: '6px 0 0', opacity: 0.92, fontWeight: 550 } as const,

  heroChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,.18)',
    border: '1px solid rgba(255,255,255,.22)',
    fontWeight: 550,
    minWidth: 220,
    justifyContent: 'center',
  } as const,

  card: {
    marginTop: 18,
    borderRadius: 16,
    background: '#ffffff',
    border: '1px solid #dbe7ff',
    boxShadow: '0 12px 30px rgba(2,6,23,.08)',
    overflow: 'hidden' as const,
  } as const,

  cardHead: {
    padding: '14px 16px',
    background: '#eef6ff',
    borderBottom: '1px solid #dbe7ff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 550,
    color: '#0b3fa5',
  } as const,

  cardBody: { padding: 16 } as const,

  grid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    alignItems: 'end',
  } as const,

  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 550,
    color: '#0b3fa5',
    marginBottom: 10,
  } as const,

  iconBadge: (bg: string) =>
    ({
      width: 30,
      height: 30,
      borderRadius: 8,
      background: bg,
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      flex: '0 0 auto',
    } as const),

  control: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #dbe3f1',
    outline: 'none',
    fontWeight: 550,
    background: '#fff',
  } as const,

  rowActions: {
    marginTop: 14,
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    justifyContent: 'flex-end',
  } as const,

  btnSoft: (disabled?: boolean) =>
    ({
      padding: '12px 14px',
      borderRadius: 10,
      border: '1px solid #dbe3f1',
      background: '#fff',
      color: '#0b3fa5',
      fontWeight: 550,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.65 : 1,
      whiteSpace: 'nowrap' as const,
      userSelect: 'none' as const,
    } as const),

  btnDangerSoft: (disabled?: boolean) =>
    ({
      padding: '12px 14px',
      borderRadius: 10,
      border: '1px solid rgba(239,68,68,.30)',
      background: 'rgba(239,68,68,.08)',
      color: '#b91c1c',
      fontWeight: 550,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.65 : 1,
      whiteSpace: 'nowrap' as const,
      userSelect: 'none' as const,
    } as const),

  btnPrimary: (disabled?: boolean) =>
    ({
      padding: '12px 14px',
      borderRadius: 10,
      border: '1px solid rgba(2,6,23,.10)',
      background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
      color: '#fff',
      fontWeight: 550,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.65 : 1,
      boxShadow: '0 14px 30px rgba(37,99,235,.25)',
      whiteSpace: 'nowrap' as const,
      userSelect: 'none' as const,
    } as const),

  // ✅ Alert tipo “notificación” como tu imagen (verde con icono)
  alert: (type: 'ok' | 'error') =>
    ({
      marginTop: 12,
      padding: '12px 14px',
      borderRadius: 14,
      border: type === 'error' ? '1px solid rgba(239,68,68,.30)' : '1px solid rgba(34,197,94,.30)',
      background: type === 'error' ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)',
      color: type === 'error' ? '#991b1b' : '#166534',
      fontWeight: 550,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as const),

  alertIcon: (type: 'ok' | 'error') =>
    ({
      width: 22,
      height: 22,
      borderRadius: 6,
      display: 'grid',
      placeItems: 'center',
      background: type === 'error' ? 'rgba(239,68,68,.14)' : 'rgba(34,197,94,.14)',
      border: type === 'error' ? '1px solid rgba(239,68,68,.20)' : '1px solid rgba(34,197,94,.20)',
      flex: '0 0 auto',
    } as const),

  tableWrap: {
    overflowX: 'auto' as const,
    borderRadius: 16,
    border: '1px solid #dbe3f1',
    background: '#fff',
    boxShadow: '0 12px 30px rgba(2,6,23,.08)',
  } as const,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    minWidth: 1050,
  } as const,

  th: {
    textAlign: 'left' as const,
    padding: '12px 12px',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: '#475569',
    borderBottom: '1px solid #eef2ff',
    background: '#f8fbff',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1,
  } as const,

  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle' as const,
    fontWeight: 550,
  } as const,

  badge: (isActive: boolean) =>
    ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 11px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 550,
      background: isActive ? 'rgba(34,197,94,.10)' : 'rgba(245,158,11,.12)',
      color: isActive ? '#166534' : '#92400e',
      border: `1px solid ${isActive ? 'rgba(34,197,94,.25)' : 'rgba(245,158,11,.28)'}`,
    } as const),

  pager: { display: 'flex', gap: 8, alignItems: 'center' } as const,
  pagerBtn: (disabled?: boolean) =>
    ({
      padding: '10px 12px',
      borderRadius: 12,
      border: '1px solid rgba(2,6,23,.10)',
      background: 'rgba(255,255,255,.92)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      fontWeight: 550,
      userSelect: 'none' as const,
    } as const),

  pagerInfo: {
    minWidth: 160,
    textAlign: 'center' as const,
    color: '#334155',
    fontWeight: 550,
  } as const,

  muted: { fontSize: 12, opacity: 0.75, fontWeight: 550 } as const,
};

export const DocentesPage = () => {
  const [nombre, setNombre] = useState('');
  const [carrera, setCarrera] = useState(''); // alta
  const [activo, setActivo] = useState(true);
  const [tipo, setTipo] = useState<TipoDocente>('HORAS');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [data, setData] = useState<Docente[]>([]);

  // carreras CRUD
  const [carreras, setCarreras] = useState<Carrera[]>([]);

  /* ================== EDICIÓN INLINE ================== */
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCarrera, setEditCarrera] = useState('');

  /* ================== FILTROS + PAGINACIÓN ================== */
  const [filtroCarrera, setFiltroCarrera] = useState<string>('Todas');
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos');
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'BASE' | 'HORAS'>('Todos');

  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // ✅ auto-hide de notificaciones
  const timerRef = useRef<number | null>(null);
  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const notifyOk = (msg: string) => {
    clearTimer();
    setError('');
    setOk(msg);
    timerRef.current = window.setTimeout(() => setOk(''), 3500);
  };
  const notifyError = (msg: string) => {
    clearTimer();
    setOk('');
    setError(msg);
    timerRef.current = window.setTimeout(() => setError(''), 4500);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  // responsive grid (sin CSS)
  const [w, setW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const isSm = w < 720;
  const isMd = w >= 720 && w < 980;

  const gridStyle = isSm
    ? { ...S.grid, gridTemplateColumns: '1fr' }
    : isMd
      ? { ...S.grid, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
      : S.grid;

  /* ================== DATA ================== */
  const cargarCarreras = async () => {
    try {
      const res = await getCarreras();
      setCarreras(Array.isArray(res) ? res : []);
    } catch {
      setCarreras([]);
    }
  };

  const cargarDocentes = async () => {
    const res = await getDocentes();
    setData(Array.isArray(res) ? res : []);
  };

  const cargarTodo = async () => {
    try {
      setLoading(true);
      await Promise.all([cargarCarreras(), cargarDocentes()]);
    } catch {
      notifyError('Error al cargar docentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const carrerasOpciones = useMemo(() => {
    const list = carreras
      .map(c => (c.nombre ?? '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return ['Todas', ...Array.from(new Set(list))];
  }, [carreras]);

  const carrerasOpcionesAlta = useMemo(() => {
    const list = carreras
      .map(c => (c.nombre ?? '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return Array.from(new Set(list));
  }, [carreras]);

  const guardar = async () => {
    try {
      setLoading(true);

      const cleanNombre = nombre.trim();

      if (!cleanNombre) {
        notifyError('El nombre no puede ir vacío');
        return;
      }

      const existe = data.some(
        d => (d.nombre ?? '').trim().toLowerCase() === cleanNombre.toLowerCase()
      );

      if (existe) {
        notifyError('Ya existe un docente con ese nombre');
        return;
      }

      await createDocente({
        nombre: cleanNombre,
        carrera: carrera.trim(),
        activo,
        tipo,
      });

      setNombre('');
      setCarrera('');
      setActivo(true);
      setTipo('HORAS');

      notifyOk('Docente creado con éxito');
      await cargarTodo();
      setPage(1);
    } catch (e: any) {
      notifyError(e?.response?.data?.message ?? 'Error al guardar docente');
    } finally {
      setLoading(false);
    }
  };

  /* ================== EDICIÓN INLINE ================== */
  const iniciarEdicion = (d: Docente) => {
    setEditId(d.id_docente);
    setEditNombre(d.nombre ?? '');
    setEditCarrera(d.carrera ?? '');
    setOk('');
    setError('');
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditNombre('');
    setEditCarrera('');
  };

  const guardarEdicion = async () => {
    if (editId == null) return;

    try {
      setLoading(true);

      const cleanNombre = editNombre.trim();
      const cleanCarrera = editCarrera.trim();

      if (!cleanNombre) {
        notifyError('El nombre no puede ir vacío');
        return;
      }
      if (!cleanCarrera) {
        notifyError('La carrera no puede ir vacía');
        return;
      }

      const existe = data.some(d => {
        const sameName = (d.nombre ?? '').trim().toLowerCase() === cleanNombre.toLowerCase();
        const otherRecord = d.id_docente !== editId;
        return sameName && otherRecord;
      });

      if (existe) {
        notifyError('Ya existe otro docente con ese nombre');
        return;
      }


      await updateDocente(editId, { nombre: cleanNombre, carrera: cleanCarrera });
      notifyOk('Docente actualizado con éxito');
      cancelarEdicion();
      await cargarTodo();
    } catch (e: any) {
      notifyError(e?.response?.data?.message ?? 'Error al actualizar docente');
    } finally {
      setLoading(false);
    }
  };

  // ✅ cambios rápidos con notificación
  const cambiarTipo = async (id: number, newTipo: TipoDocente) => {
    try {
      setLoading(true);
      await updateDocenteTipo(id, newTipo);
      notifyOk('Tipo de docente actualizado');
      await cargarTodo();
    } catch (e: any) {
      notifyError(e?.response?.data?.message ?? 'Error al actualizar tipo');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id: number, newEstado: boolean) => {
    try {
      setLoading(true);
      await updateDocenteEstado(id, newEstado);
      notifyOk(newEstado ? 'Docente activado con éxito' : 'Docente desactivado con éxito');
      await cargarTodo();
    } catch (e: any) {
      notifyError(e?.response?.data?.message ?? 'Error al actualizar estado');
    } finally {
      setLoading(false);
    }
  };

  const eliminarDocente = async (id: number) => {
    if (!confirm('¿Eliminar docente?')) return;

    try {
      setLoading(true);
      await deleteDocente(id);
      notifyOk('Docente eliminado con éxito');
      await cargarTodo();
    } catch (e: any) {
      notifyError(e?.response?.data?.message ?? 'Error al eliminar docente');
    } finally {
      setLoading(false);
    }
  };

  /* ================== FILTROS + ORDEN ================== */
  const docentesFiltradosOrdenados = useMemo(() => {
    let lista = [...data];

    if (filtroCarrera !== 'Todas') {
      lista = lista.filter(d => (d.carrera ?? '').trim() === filtroCarrera);
    }

    if (filtroEstado !== 'Todos') {
      const isActivo = filtroEstado === 'Activo';
      lista = lista.filter(d => Boolean(d.activo) === isActivo);
    }

    if (filtroTipo !== 'Todos') {
      lista = lista.filter(d => d.tipo === filtroTipo);
    }

    return lista.sort((a, b) => {
      const c = (a.carrera ?? '').localeCompare(b.carrera ?? '');
      return c !== 0 ? c : (a.nombre ?? '').localeCompare(b.nombre ?? '');
    });
  }, [data, filtroCarrera, filtroEstado, filtroTipo]);

  useEffect(() => {
    setPage(1);
  }, [filtroCarrera, filtroEstado, filtroTipo, pageSize]);

  const totalFiltrados = docentesFiltradosOrdenados.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalFiltrados / pageSize)), [totalFiltrados, pageSize]);
  const safePage = Math.min(Math.max(1, page), totalPages);

  const docentesPagina = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return docentesFiltradosOrdenados.slice(start, start + pageSize);
  }, [docentesFiltradosOrdenados, safePage, pageSize]);

  const showingFrom = totalFiltrados === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = totalFiltrados === 0 ? 0 : Math.min(safePage * pageSize, totalFiltrados);

  return (
    <div style={S.screen}>
      <div style={S.page}>
        {/* HERO */}
        <header style={S.hero}>
          <div style={S.heroRow}>
            <div style={S.heroLeft}>
              <div style={S.heroIconCircle}>
                <Icon name="cap" />
              </div>
              <div>
                <h1 style={S.h1}>Docentes</h1>
                <div style={S.sub}>Administra los docentes.</div>
              </div>
            </div>

            <div style={S.heroChip}>
              <Icon name="list" />
              <span style={{ fontWeight: 550 }}>{totalFiltrados}</span>
              <span style={{ opacity: 0.9, fontWeight: 550 }}>docentes</span>
            </div>
          </div>
        </header>

        {/* ALTA */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <Icon name="user" />
            Registrar docente
          </div>

          <div style={S.cardBody}>
            <div style={gridStyle}>
              <div>
                <div style={S.labelRow}>
                  <span style={S.iconBadge('#2563eb')}>
                    <Icon name="user" />
                  </span>
                  Nombre
                </div>
                <input
                  style={S.control}
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <div style={S.labelRow}>
                  <span style={S.iconBadge('#8b5cf6')}>
                    <Icon name="book" />
                  </span>
                  Carrera
                </div>
                <select style={S.control} value={carrera} onChange={e => setCarrera(e.target.value)}>
                  <option value="">
                    {carrerasOpcionesAlta.length ? 'Selecciona una carrera' : 'No hay carreras (crea una primero)'}
                  </option>
                  {carrerasOpcionesAlta.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.labelRow}>
                  <span style={S.iconBadge('#f59e0b')}>
                    <Icon name="toggle" />
                  </span>
                  Estado
                </div>
                <select
                  style={S.control}
                  value={activo ? 'ACTIVO' : 'INACTIVO'}
                  onChange={e => setActivo(e.target.value === 'ACTIVO')}
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>

              <div>
                <div style={S.labelRow}>
                  <span style={S.iconBadge('#06b6d4')}>
                    <Icon name="cap" />
                  </span>
                  Tipo
                </div>
                <select style={S.control} value={tipo} onChange={e => setTipo(e.target.value as TipoDocente)}>
                  <option value="BASE">Base</option>
                  <option value="HORAS">Por horas</option>
                </select>
              </div>
            </div>

            <div style={S.rowActions}>
              <button style={S.btnSoft(loading)} onClick={cargarTodo} disabled={loading} type="button">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="reload" />
                  Recargar
                </span>
              </button>

              <button
                style={S.btnPrimary(loading || !nombre.trim() || !carrera.trim())}
                onClick={guardar}
                disabled={loading || !nombre.trim() || !carrera.trim()}
                type="button"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="save" />
                  Guardar
                </span>
              </button>
            </div>

            {/* ✅ Notificaciones tipo imagen */}
            {ok ? (
              <div style={S.alert('ok')}>
                <span style={S.alertIcon('ok')}>
                  <Icon name="checkCircle" />
                </span>
                <span>{ok}</span>
              </div>
            ) : null}

            {error ? (
              <div style={S.alert('error')}>
                <span style={S.alertIcon('error')}>
                  <Icon name="xCircle" />
                </span>
                <span>{error}</span>
              </div>
            ) : null}
          </div>
        </section>

        {/* LISTA + FILTROS */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <Icon name="filter" />
            Filtros de búsqueda
          </div>
          <div style={S.cardBody}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            />

            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: isSm ? '1fr' : isMd ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                alignItems: 'end',
              }}
            >
              <div>
                <div style={S.labelRow}>
                  <span style={S.iconBadge('#8b5cf6')}>
                    <Icon name="book" />
                  </span>
                  Carrera (filtro)
                </div>
                <select style={S.control} value={filtroCarrera} onChange={e => setFiltroCarrera(e.target.value)}>
                  {carrerasOpciones.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.labelRow}>
                  <span style={S.iconBadge('#f59e0b')}>
                    <Icon name="toggle" />
                  </span>
                  Estado (filtro)
                </div>
                <select
                  style={S.control}
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value as 'Todos' | 'Activo' | 'Inactivo')}
                >
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                </select>
              </div>

              <div>
                <div style={S.labelRow}>
                  <span style={S.iconBadge('#06b6d4')}>
                    <Icon name="cap" />
                  </span>
                  Tipo (filtro)
                </div>
                <select
                  style={S.control}
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value as 'Todos' | 'BASE' | 'HORAS')}
                >
                  <option value="Todos">Todos</option>
                  <option value="BASE">Base</option>
                  <option value="HORAS">Por horas</option>
                </select>
              </div>
            </div>

            <div>
              <div style={S.muted}>
                Mostrando <b>{showingFrom}–{showingTo}</b> de <b>{totalFiltrados}</b>
              </div>
            </div>

            {/* PAGINACIÓN */}
            <div
              style={{
                marginTop: 14,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'end',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 170 }}>
                <div style={S.muted}>Paginación</div>
                <select style={S.control} value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ paddingTop: 18, ...S.pager }}>
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={safePage <= 1 || loading}
                  style={S.pagerBtn(safePage <= 1 || loading)}
                >
                  {'<<'}
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1 || loading}
                  style={S.pagerBtn(safePage <= 1 || loading)}
                >
                  {'<'}
                </button>

                <div style={S.pagerInfo}>
                  Página <b>{safePage}</b> / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages || loading}
                  style={S.pagerBtn(safePage >= totalPages || loading)}
                >
                  {'>'}
                </button>

                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage >= totalPages || loading}
                  style={S.pagerBtn(safePage >= totalPages || loading)}
                >
                  {'>>'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14, ...S.tableWrap }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Nombre</th>
                    <th style={S.th}>Carrera</th>
                    <th style={S.th}>Estado</th>
                    <th style={S.th}>Tipo</th>
                    <th style={S.th}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td style={S.td} colSpan={5}>
                        Cargando…
                      </td>
                    </tr>
                  ) : docentesPagina.length === 0 ? (
                    <tr>
                      <td style={S.td} colSpan={5}>
                        No hay docentes con esos filtros.
                      </td>
                    </tr>
                  ) : (
                    docentesPagina.map(d => {
                      const editing = editId === d.id_docente;

                      return (
                        <tr key={d.id_docente}>
                          <td style={S.td}>
                            {editing ? (
                              <input
                                style={S.control}
                                value={editNombre}
                                onChange={e => setEditNombre(e.target.value)}
                                placeholder="Nombre"
                              />
                            ) : (
                              <span style={{ fontWeight: 550 }}>{d.nombre}</span>
                            )}
                          </td>

                          <td style={S.td}>
                            {editing ? (
                              <select
                                style={S.control}
                                value={editCarrera}
                                onChange={e => setEditCarrera(e.target.value)}
                              >
                                <option value="">
                                  {carrerasOpcionesAlta.length ? 'Selecciona una carrera' : 'No hay carreras'}
                                </option>
                                {carrerasOpcionesAlta.map(c => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              d.carrera
                            )}
                          </td>

                          <td style={S.td}>
                            <span style={S.badge(Boolean(d.activo))}>{d.activo ? 'Activo' : 'Inactivo'}</span>
                          </td>

                          <td style={S.td}>
                            <select
                              style={S.control}
                              value={d.tipo}
                              disabled={loading || editing}
                              onChange={e => cambiarTipo(d.id_docente, e.target.value as TipoDocente)}
                              title={editing ? 'Termina la edición antes de cambiar el tipo' : undefined}
                            >
                              <option value="BASE">Base</option>
                              <option value="HORAS">Por horas</option>
                            </select>
                          </td>

                          <td style={S.td}>
                            {editing ? (
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                  style={S.btnPrimary(loading || !editNombre.trim() || !editCarrera.trim())}
                                  disabled={loading || !editNombre.trim() || !editCarrera.trim()}
                                  onClick={guardarEdicion}
                                  type="button"
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <Icon name="save" />
                                    Guardar
                                  </span>
                                </button>

                                <button
                                  style={S.btnSoft(loading)}
                                  disabled={loading}
                                  onClick={cancelarEdicion}
                                  type="button"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                  style={S.btnSoft(loading)}
                                  disabled={loading}
                                  onClick={() => iniciarEdicion(d)}
                                  type="button"
                                >
                                  Editar
                                </button>

                                <button
                                  style={S.btnSoft(loading)}
                                  disabled={loading}
                                  onClick={() => cambiarEstado(d.id_docente, !d.activo)}
                                  type="button"
                                >
                                  {d.activo ? 'Desactivar' : 'Activar'}
                                </button>

                                <button
                                  style={S.btnDangerSoft(loading)}
                                  disabled={loading}
                                  onClick={() => eliminarDocente(d.id_docente)}
                                  type="button"
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <Icon name="trash" />
                                    Eliminar
                                  </span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ Notificaciones también visibles aquí (por si haces acciones abajo) */}
            {ok ? (
              <div style={S.alert('ok')}>
                <span style={S.alertIcon('ok')}>
                  <Icon name="checkCircle" />
                </span>
                <span>{ok}</span>
              </div>
            ) : null}

            {error ? (
              <div style={S.alert('error')}>
                <span style={S.alertIcon('error')}>
                  <Icon name="xCircle" />
                </span>
                <span>{error}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};
