import { useEffect, useMemo, useState } from 'react';
import {
  getPaseLista,
  guardarPaseLista,
  type EstadoAsistencia,
  type PaseListaItem,
} from '../api/asistencias';
import { getEdificios } from '../api/edificios';

const ESTADOS: { value: EstadoAsistencia; label: string }[] = [
  { value: 'PRESENTE', label: 'Presente' },
  { value: 'AUSENTE', label: 'Ausente' },
  { value: 'RETARDO', label: 'Retardo' },
  { value: 'INCAPACIDAD', label: 'Incapacidad' },
  { value: 'COMISION', label: 'Comisión' },
];

type SalonCatalogo = { nombre?: string | null };
type EdificioCatalogo = { nombre?: string | null; salones?: SalonCatalogo[] | null };

// Horas permitidas: 07:00 a 21:00 (para el filtro)
const HORAS_CLASE = Array.from({ length: 21 - 7 + 1 }, (_, i) => {
  const h = i + 7;
  return `${String(h).padStart(2, '0')}:00`;
});

// Helpers
const normalize = (v?: string) => String(v ?? '').trim().toUpperCase();

const labelFechaHora = () => {
  const now = new Date();
  const fechaTxt = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const horaTxt = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  return `${fechaTxt}, ${horaTxt}`;
};

// Date helpers (YYYY-MM-DD) en hora LOCAL (evita bug UTC)
const pad2 = (n: number) => String(n).padStart(2, '0');
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const todayLocalYMD = () => toYMD(new Date());

const clampToTodayYMD = (ymd?: string) => {
  const t = todayLocalYMD();
  const v = String(ymd ?? '').slice(0, 10);
  if (!v) return v;
  return v > t ? t : v;
};

// Icons (SVG inline)
const Icon = ({
  name,
}: {
  name: 'cap' | 'filter' | 'calendar' | 'building' | 'clock' | 'user' | 'book' | 'pin' | 'chat' | 'check';
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
    case 'calendar':
      return (
        <svg {...common}>
          <path d="M8 3v4M16 3v4" />
          <path d="M3 8h18" />
          <rect x="3" y="5" width="18" height="16" rx="2" />
        </svg>
      );
    case 'building':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
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
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 22s7-4.5 7-12a7 7 0 0 0-14 0c0 7.5 7 12 7 12Z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    default:
      return null;
  }
};

// Styles
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
    maxWidth: 1240,
    margin: '0 auto',
    padding: '0 18px',
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

  heroLeft: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 } as const,

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
  sub: { margin: '6px 0 0', opacity: 0.9, fontWeight: 550 } as const,

  heroChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,.18)',
    border: '1px solid rgba(255,255,255,.22)',
    fontWeight: 900,
    minWidth: 160,
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

  filtersGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    alignItems: 'end',
  } as const,

  fieldLabelRow: {
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

  btnOutlineDanger: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '2px solid #fca5a5',
    background: '#fff',
    color: '#ef4444',
    fontWeight: 550,
    cursor: 'pointer',
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
    } as const),

  listWrap: { marginTop: 16, display: 'grid', gap: 14 } as const,

  classCard: {
    borderRadius: 16,
    background: '#fff',
    border: '1px solid #dbe3f1',
    boxShadow: '0 12px 30px rgba(2,6,23,.08)',
    overflow: 'hidden' as const,
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
  } as const,

  leftStripe: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    background: 'linear-gradient(180deg, #1d4ed8 0%, #3b82f6 100%)',
  } as const,

  classLeft: {
    position: 'relative' as const,
    padding: 16,
    paddingLeft: 18,
  } as const,

  classTopRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as const,

  classIconSquare: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: '#1d4ed8',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 10px 20px rgba(29,78,216,.25)',
    flex: '0 0 auto',
  } as const,

  grupo: { fontSize: 18, fontWeight: 550, margin: 0 } as const,

  infoGrid: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  } as const,

  pillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    background: '#f8fbff',
    border: '1px solid #eef2ff',
    color: '#0f172a',
    fontWeight: 550,
    minWidth: 0,
  } as const,

  muted: { opacity: 0.75, fontWeight: 550 } as const,

  materiaRow: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#4b5563',
    fontWeight: 550,
  } as const,

  classRight: {
    padding: 16,
    borderLeft: '1px solid #eef2ff',
    display: 'grid',
    gap: 10,
    alignContent: 'start',
    background: '#ffffff',
  } as const,

  selectBig: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #dbe3f1',
    outline: 'none',
    fontWeight: 550,
    background: '#fff',
  } as const,

  inputBig: {
    width: '100%',
    padding: '12px 14px',
    borderRadiusadius: 10,
    border: '1px solid #dbe3f1',
    outline: 'none',
    fontWeight: 550,
    background: '#fff',
  } as any,

  footerBar: {
    marginTop: 18,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  } as const,

  hint: { fontSize: 16, color: '#64748b', fontWeight: 550 } as const,

  alert: (type: 'error' | 'ok') =>
    ({
      marginTop: 12,
      padding: '12px 14px',
      borderRadius: 14,
      border: type === 'error' ? '1px solid rgba(239,68,68,.30)' : '1px solid rgba(34,197,94,.30)',
      background: type === 'error' ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)',
      color: type === 'error' ? '#991b1b' : '#166534',
      fontWeight: 550,
    } as const),

  okBanner: {
    marginTop: 12,
    borderRadius: 12,
    border: '1px solid rgba(34,197,94,.35)',
    background: 'rgba(34,197,94,.08)',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#166534',
    fontWeight: 650,
  } as const,

  okIcon: {
    width: 18,
    height: 18,
    borderRadius: 6,
    background: 'rgba(34,197,94,.18)',
    border: '1px solid rgba(34,197,94,.35)',
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 auto',
    color: '#166534',
  } as const,
};

export const PaseListaPage = () => {
  const [fecha, setFecha] = useState(() => todayLocalYMD()); 

  const [horarios, setHorarios] = useState<PaseListaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [estadoPorHorario, setEstadoPorHorario] = useState<Record<number, EstadoAsistencia>>({});
  const [notaPorHorario, setNotaPorHorario] = useState<Record<number, string>>({});

  // filtros
  const [filtroHora, setFiltroHora] = useState<string>('Todas');
  const [filtroEdificio, setFiltroEdificio] = useState<string>('Todos');
  const [filtroSalon, setFiltroSalon] = useState<string>('Todos');

  // catálogo edificios/salones
  const [edificiosCrud, setEdificiosCrud] = useState<EdificioCatalogo[]>([]);

  // cargar catálogo una vez
  useEffect(() => {
    (async () => {
      try {
        const data = await getEdificios();
        setEdificiosCrud(Array.isArray(data) ? (data as EdificioCatalogo[]) : []);
      } catch (e) {
        console.error(e);
        setEdificiosCrud([]);
      }
    })();
  }, []);

  const edificiosOpciones = useMemo<string[]>(() => {
    const nombres = edificiosCrud
      .map((e: EdificioCatalogo) => (e.nombre ?? '').trim())
      .filter((n): n is string => Boolean(n));

    return ['Todos', ...Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b))];
  }, [edificiosCrud]);

  const salonesOpciones = useMemo<string[]>(() => {
    if (filtroEdificio === 'Todos') return ['Todos'];

    const ed = edificiosCrud.find((e: EdificioCatalogo) => (e.nombre ?? '').trim() === filtroEdificio);
    const salones = (ed?.salones ?? [])
      .map((s: SalonCatalogo) => (s.nombre ?? '').trim())
      .filter((n): n is string => Boolean(n));

    return ['Todos', ...Array.from(new Set(salones)).sort((a, b) => a.localeCompare(b))];
  }, [edificiosCrud, filtroEdificio]);

  // Horas del filtro: fijo 07:00 a 21:00 (+ Todas)
  const horasOpciones = useMemo<string[]>(() => ['Todas', ...HORAS_CLASE], []);

  // Función única para decidir si una tarjeta está bloqueada
  const isLocked = (h: PaseListaItem) => {
    const hr = (h as any).horaRegistro as string | null | undefined;
    const est = (h as any).estado as EstadoAsistencia | null | undefined;
    const lockedByBackend = Boolean((h as any).bloqueado);
    // Si hay registro previo (horaRegistro o estado) O backend dice bloqueado -> NO se puede capturar aquí
    return lockedByBackend || Boolean(hr) || Boolean(est);
  };

  const horariosFiltrados = useMemo(() => {
    let lista = horarios;

    if (filtroHora !== 'Todas') {
      lista = lista.filter(h => h.horaClase === filtroHora);
    }
    if (filtroEdificio !== 'Todos') {
      lista = lista.filter(h => (h.edificio ?? '') === filtroEdificio);
    }
    if (filtroSalon !== 'Todos') {
      lista = lista.filter(h => String(h.salon ?? '') === String(filtroSalon));
    }

    const num = (v?: string) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    };

    const horaInicio = (hora: string) => {
      const m = hora.match(/(\d{1,2})(?::\d{2})?/);
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
    };

    return [...lista].sort((a, b) => {
      const cmpEd = normalize(a.edificio).localeCompare(normalize(b.edificio));
      if (cmpEd !== 0) return cmpEd;

      const cmpSalon = num(String(a.salon ?? '')) - num(String(b.salon ?? ''));
      if (cmpSalon !== 0) return cmpSalon;

      return horaInicio(a.horaClase) - horaInicio(b.horaClase);
    });
  }, [horarios, filtroHora, filtroEdificio, filtroSalon]);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      setMensaje('');

      const data = await getPaseLista(fecha);
      const arr = Array.isArray(data) ? (data as PaseListaItem[]) : [];
      setHorarios(arr);

      const estadoInit: Record<number, EstadoAsistencia> = {};
      const notaInit: Record<number, string> = {};

      arr.forEach(h => {
        const locked = isLocked(h);

        const estadoBackend = (h as any).estado as EstadoAsistencia | null | undefined;
        const notaBackend = (h as any).notaAdicional as string | null | undefined;

        estadoInit[h.idHorario] = locked
          ? (estadoBackend ?? 'PRESENTE')
          : (estadoPorHorario[h.idHorario] ?? (estadoBackend ?? 'PRESENTE'));

        notaInit[h.idHorario] = locked
          ? (notaBackend ?? '')
          : (notaPorHorario[h.idHorario] ?? (notaBackend ?? ''));
      });

      setEstadoPorHorario(estadoInit);
      setNotaPorHorario(notaInit);

      // Si hay algo registrado/bloqueado en la respuesta, muestra hint visual (opcional)
      const hayAlgoRegistrado = arr.some(x => isLocked(x));
      if (hayAlgoRegistrado) {
        // No forzamos "guardado", solo avisamos que hay bloqueos/registrados
        // (el banner verde lo usamos cuando el usuario guarda)
      }
    } catch (e) {
      console.error(e);
      setError('Error al cargar el pase de lista');
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [fecha]);

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setError('');
      setMensaje('');

      // solo guardamos los NO bloqueados del filtro actual
      const paraGuardar = horariosFiltrados.filter(h => !isLocked(h));

      if (paraGuardar.length === 0) {
        setError('No hay registros para guardar (todo está bloqueado o ya registrado).');
        return;
      }

      const registros = paraGuardar.map(h => ({
        idHorario: h.idHorario,
        estado: estadoPorHorario[h.idHorario] ?? 'PRESENTE',
        notaAdicional: (notaPorHorario[h.idHorario] ?? '').trim() || undefined,
      }));

      await guardarPaseLista({ fecha, registros });

      // recargar para traer horaRegistro y refrescar bloqueos
      await cargar();

      setMensaje('✅ Pase de lista guardado');
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.response?.data?.message ?? 'Error al guardar el pase de lista';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setGuardando(false);
    }
  };

  const total = horariosFiltrados.length;

  const limpiarFiltros = () => {
    setFiltroHora('Todas');
    setFiltroEdificio('Todos');
    setFiltroSalon('Todos');
  };

  const [w, setW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const isSm = w < 720;
  const isMd = w >= 720 && w < 980;

  const filtersGridStyle = isSm
    ? { ...S.filtersGrid, gridTemplateColumns: '1fr' }
    : isMd
      ? { ...S.filtersGrid, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
      : S.filtersGrid;

  const classCardStyle = isSm ? { ...S.classCard, gridTemplateColumns: '1fr' } : S.classCard;
  const rightStyle = isSm ? { ...S.classRight, borderLeft: 'none', borderTop: '1px solid #eef2ff' } : S.classRight;
  const infoGridStyle = isSm ? { ...S.infoGrid, gridTemplateColumns: '1fr' } : S.infoGrid;

  const allLocked = horariosFiltrados.length > 0 && horariosFiltrados.every(h => isLocked(h));
  const anyLocked = horariosFiltrados.some(h => isLocked(h));

  const disableGlobal = loading || guardando;

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
                <h1 style={S.h1}>Registro de Asistencia</h1>
                <div style={S.sub}>{labelFechaHora()}</div>
              </div>
            </div>

            <div style={S.heroChip}>
              <Icon name="book" />
              <span style={{ fontWeight: 550 }}>{total}</span>
              <span style={{ opacity: 0.9, fontWeight: 550 }}>clases</span>
            </div>
          </div>
        </header>

        {/* FILTROS */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <Icon name="filter" />
            Filtros de búsqueda
          </div>

          <div style={S.cardBody}>
            <div style={filtersGridStyle}>
              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#7c3aed')}>
                    <Icon name="calendar" />
                  </span>
                  Fecha
                </div>
                <input
                  type="date"
                  value={fecha}
                  max={todayLocalYMD()}
                  onChange={e => setFecha(clampToTodayYMD(e.target.value))}
                  style={S.control}
                />
              </div>

              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#ea580c')}>
                    <Icon name="clock" />
                  </span>
                  Hora de clase
                </div>
                <select value={filtroHora} onChange={e => setFiltroHora(e.target.value)} style={S.control}>
                  {horasOpciones.map(h => (
                    <option key={h} value={h}>
                      {h === 'Todas' ? 'Todas las horas' : h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#059669')}>
                    <Icon name="building" />
                  </span>
                  Edificio
                </div>
                <select
                  value={filtroEdificio}
                  onChange={e => {
                    const v = e.target.value;
                    setFiltroEdificio(v);
                    setFiltroSalon('Todos');
                  }}
                  style={S.control}
                >
                  {edificiosOpciones.map(ed => (
                    <option key={ed} value={ed}>
                      {ed === 'Todos' ? 'Todos los edificios' : ed}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#2563eb')}>
                    <Icon name="pin" />
                  </span>
                  Salón
                </div>
                <select
                  value={filtroSalon}
                  onChange={e => setFiltroSalon(e.target.value)}
                  style={S.control}
                  disabled={filtroEdificio === 'Todos'}
                  title={filtroEdificio === 'Todos' ? 'Selecciona edificio primero' : undefined}
                >
                  {salonesOpciones.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button onClick={limpiarFiltros} type="button" style={S.btnOutlineDanger}>
                    Limpiar filtros
                  </button>
                  <button onClick={cargar} disabled={loading} type="button" style={S.btnSoft(loading)}>
                    {loading ? 'Actualizando…' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </div>

            {error && <div style={S.alert('error')}>{error}</div>}
          </div>
        </section>

        {/* LISTA */}
        {loading ? (
          <section style={S.card}>
            <div style={S.cardBody}>Cargando...</div>
          </section>
        ) : horariosFiltrados.length === 0 ? (
          <section style={S.card}>
            <div style={S.cardBody}>No hay horarios para esta fecha con esos filtros.</div>
          </section>
        ) : (
          <div style={S.listWrap}>
            {horariosFiltrados.map(h => {
              const profesor = (h as any).profesor ?? 'Sin profesor';
              const carrera = (h as any).carrera ?? '';
              const materia = (h as any).materia ?? (h as any).nombreMateria ?? '';
              const grupo = (h as any).grupo ?? (h as any).semestreGrupo ?? carrera ?? 'Clase';
              const edificio = (h.edificio ?? '-').toString();
              const salon = (h.salon ?? '-').toString();
              const hora = h.horaClase ? `${h.horaClase}` : '';
              const horaRegistro = (h as any).horaRegistro as string | null | undefined;

              const ubicacion = `${edificio}-${salon}`;

              const locked = isLocked(h);
              const motivoBloqueo = (h as any).motivoBloqueo as string | null | undefined;

              return (
                <article key={h.idHorario} style={classCardStyle}>
                  {/* LEFT */}
                  <div style={S.classLeft}>
                    <div style={S.leftStripe} />

                    <div style={S.classTopRow}>
                      <div style={S.classIconSquare}>
                        <Icon name="cap" />
                      </div>
                      <div>
                        <p style={S.grupo}>{grupo}</p>
                      </div>
                    </div>

                    <div style={infoGridStyle}>
                      <div style={S.pillRow}>
                        <Icon name="user" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {profesor}
                        </span>
                      </div>

                      <div style={S.pillRow}>
                        <span style={{ color: '#059669' }}>
                          <Icon name="pin" />
                        </span>
                        <span style={{ fontWeight: 550 }}>{ubicacion}</span>
                      </div>

                      <div style={S.pillRow}>
                        <span style={{ color: '#ea580c' }}>
                          <Icon name="clock" />
                        </span>
                        <span style={{ fontWeight: 550 }}>{hora || h.horaClase}</span>
                      </div>

                      {horaRegistro ? (
                        <div style={S.pillRow}>
                          <span style={{ color: '#16a34a' }}>
                            <Icon name="clock" />
                          </span>
                          <span style={{ fontWeight: 550 }}>Registrado: {horaRegistro}</span>
                        </div>
                      ) : null}
                    </div>

                    <div style={S.materiaRow}>
                      <span style={{ color: '#7c3aed' }}>
                        <Icon name="book" />
                      </span>
                      <span style={S.muted}>{materia || carrera}</span>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div style={rightStyle}>
                    {/* aviso específico por tarjeta */}
                    {locked && motivoBloqueo ? (
                      <div style={{ ...S.alert('error'), marginTop: 0 }}>
                        {motivoBloqueo}
                      </div>
                    ) : null}

                    <select
                      value={estadoPorHorario[h.idHorario] ?? 'PRESENTE'}
                      onChange={e =>
                        setEstadoPorHorario(prev => ({
                          ...prev,
                          [h.idHorario]: e.target.value as EstadoAsistencia,
                        }))
                      }
                      style={S.selectBig}
                      disabled={disableGlobal || locked}
                      title={
                        locked
                          ? (motivoBloqueo ??
                            'Este registro está bloqueado porque ya existe pase de lista. Corrige en "Modificación de asistencias".')
                          : undefined
                      }
                    >
                      <option value="" disabled>
                        📋 Asignar estado
                      </option>
                      {ESTADOS.map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    <div style={{ position: 'relative' }}>
                      <input
                        value={notaPorHorario[h.idHorario] ?? ''}
                        onChange={e =>
                          setNotaPorHorario(prev => ({
                            ...prev,
                            [h.idHorario]: e.target.value,
                          }))
                        }
                        placeholder="Comentario adicional (opcional)"
                        style={S.inputBig}
                        disabled={disableGlobal || locked}
                        title={
                          locked
                            ? (motivoBloqueo ??
                              'Este registro está bloqueado porque ya existe pase de lista. Corrige en "Modificación de asistencias".')
                            : undefined
                        }
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                          opacity: 0.55,
                          color: '#0b3fa5',
                        }}
                        title="Comentario"
                      >
                        <Icon name="chat" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div style={S.footerBar}>
          <div style={S.hint}>
            {allLocked
              ? 'Todo lo filtrado ya está registrado o bloqueado. Si necesitas corregir, usa "Modificación de asistencias".'
              : anyLocked
                ? 'Hay registros ya registrados/bloqueados. Solo se guardarán los que estén disponibles.'
                : 'Consejo: filtra por edificio/salón/hora y marca rápido; luego guarda.'}
          </div>

          <div style={{ width: isSm ? '100%' : 'auto' }}>
            <button
              onClick={handleGuardar}
              disabled={guardando || horariosFiltrados.length === 0 || allLocked}
              style={S.btnPrimary(guardando || horariosFiltrados.length === 0 || allLocked)}
              title={
                allLocked
                  ? 'No hay nada que guardar (todo está registrado/bloqueado).'
                  : undefined
              }
            >
              {allLocked ? 'Todo ya está registrado' : guardando ? 'Guardando…' : 'Guardar pase de lista'}
            </button>

            {mensaje ? (
              <div style={S.okBanner}>
                <span style={S.okIcon}>
                  <Icon name="check" />
                </span>
                <span>{mensaje.replace('✅ ', '')}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
