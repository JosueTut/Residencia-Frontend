import { useEffect, useMemo, useState } from 'react';
import {
  getAsistenciasPorFecha,
  updateAsistencia,
  type AsistenciaItem,
} from '../api/asistencias';
import { getEdificios } from '../api/edificios';

const ESTADOS = [
  'PRESENTE',
  'AUSENTE',
  'RETARDO',
  'INCAPACIDAD',
  'COMISION',
  'SUSPENDIDO',
] as const;

// Tipos locales
type SalonCatalogo = { nombre?: string | null };
type EdificioCatalogo = { nombre?: string | null; salones?: SalonCatalogo[] | null };

// Horas permitidas: 07:00 a 21:00
const HORAS_CLASE = Array.from({ length: 21 - 7 + 1 }, (_, i) => {
  const h = i + 7;
  return `${String(h).padStart(2, '0')}:00`;
});

// Date helpers (local YYYY-MM-DD)
const pad2 = (n: number) => String(n).padStart(2, '0');
const toLocalYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Icons (SVG inline)
const Icon = ({
  name,
}: {
  name:
    | 'cap'
    | 'filter'
    | 'calendar'
    | 'building'
    | 'clock'
    | 'user'
    | 'book'
    | 'pin'
    | 'save'
    | 'reload'
    | 'note';
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
    case 'save':
      return (
        <svg {...common}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
          <path d="M17 21v-8H7v8" />
          <path d="M7 3v5h8" />
        </svg>
      );
    case 'reload':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v6h-6" />
        </svg>
      );
    case 'note':
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
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
    fontWeight: 550,
    minWidth: 180,
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

  rowActions: {
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

  itemCard: {
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

  itemLeft: {
    position: 'relative' as const,
    padding: 16,
    paddingLeft: 18,
  } as const,

  topRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as const,

  iconSquare: {
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

  mainTitle: { fontSize: 18, fontWeight: 550, margin: 0 } as const,

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

  muted: { opacity: 0.75, fontWeight: 550, fontSize: 12 } as const,
  itemRight: {
    padding: 16,
    borderLeft: '1px solid #eef2ff',
    display: 'grid',
    gap: 10,
    alignContent: 'start',
    background: '#ffffff',
  } as const,

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
};

export const RegistroAsistenciasPage = () => {
  const hoyYmd = toLocalYMD(new Date());
  const clampToHoy = (v: string) => (v && v > hoyYmd ? hoyYmd : v);

  const [fecha, setFecha] = useState(() => hoyYmd);
  const [data, setData] = useState<AsistenciaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

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
        const res = await getEdificios();
        setEdificiosCrud(Array.isArray(res) ? (res as EdificioCatalogo[]) : []);
      } catch (e) {
        console.error(e);
        setEdificiosCrud([]);
      }
    })();
  }, []);

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

  const itemCardStyle = isSm ? { ...S.itemCard, gridTemplateColumns: '1fr' } : S.itemCard;
  const rightStyle = isSm
    ? { ...S.itemRight, borderLeft: 'none', borderTop: '1px solid #eef2ff' }
    : S.itemRight;
  const infoGridStyle = isSm ? { ...S.infoGrid, gridTemplateColumns: '1fr' } : S.infoGrid;

  const edificiosOpciones = useMemo<string[]>(() => {
    const nombres = edificiosCrud
      .map((e: EdificioCatalogo) => (e.nombre ?? '').trim())
      .filter((n): n is string => Boolean(n));

    return ['Todos', ...Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b))];
  }, [edificiosCrud]);

  const salonesOpciones = useMemo<string[]>(() => {
    if (filtroEdificio === 'Todos') return ['Todos'];

    const ed = edificiosCrud.find(
      (e: EdificioCatalogo) => (e.nombre ?? '').trim() === filtroEdificio,
    );

    const salones = (ed?.salones ?? [])
      .map((s: SalonCatalogo) => (s.nombre ?? '').trim())
      .filter((n): n is string => Boolean(n));

    return ['Todos', ...Array.from(new Set(salones)).sort((a, b) => a.localeCompare(b))];
  }, [edificiosCrud, filtroEdificio]);

  const horasOpciones = useMemo<string[]>(() => ['Todas', ...HORAS_CLASE], []);

  const dataFiltrada = useMemo(() => {
    let lista = data;

    if (filtroHora !== 'Todas') lista = lista.filter(a => a.horaClase === filtroHora);
    if (filtroEdificio !== 'Todos') lista = lista.filter(a => (a.edificio ?? '') === filtroEdificio);
    if (filtroSalon !== 'Todos') lista = lista.filter(a => String(a.salon ?? '') === String(filtroSalon));

    const texto = (v?: string) => (v ?? '').toUpperCase();
    const num = (v?: string) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    };
    const horaInicio = (hora: string) => {
      const m = hora.match(/(\d{1,2})(?::\d{2})?/);
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
    };

    return [...lista].sort((a, b) => {
      const cmpEd = texto(a.edificio).localeCompare(texto(b.edificio));
      if (cmpEd !== 0) return cmpEd;

      const cmpSalon = num(String(a.salon ?? '')) - num(String(b.salon ?? ''));
      if (cmpSalon !== 0) return cmpSalon;

      return horaInicio(a.horaClase) - horaInicio(b.horaClase);
    });
  }, [data, filtroHora, filtroEdificio, filtroSalon]);

  const total = dataFiltrada.length;

  const cargar = async () => {
    try {
      setLoading(true);
      setMensaje('');
      setError('');
      const res = await getAsistenciasPorFecha(fecha);
      setData(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las asistencias.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [fecha]);

  const handleChange = (id: number, field: 'estado' | 'nota', value: string) => {
    setData(prev => prev.map(a => (a.idAsistencia === id ? { ...a, [field]: value } : a)));
  };

  const guardarCambios = async () => {
    try {
      setSaving(true);
      setMensaje('');
      setError('');

      for (const a of data) {
        await updateAsistencia(a.idAsistencia, {
          estado: a.estado,
          notaAdicional: a.nota,
        });
      }

      setMensaje('✅ Cambios guardados correctamente');
    } catch (e) {
      console.error(e);
      setError('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroHora('Todas');
    setFiltroEdificio('Todos');
    setFiltroSalon('Todos');
  };

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
                <h1 style={S.h1}>Modificar Asistencias</h1>
                <div style={S.sub}>Modifica estado y nota por registro</div>
              </div>
            </div>

            <div style={S.heroChip}>
              <Icon name="book" />
              <span style={{ fontWeight: 550 }}>{total}</span>
              <span style={{ opacity: 0.9, fontWeight: 550 }}>registros</span>
            </div>
          </div>
        </header>

        {/* CONTROLES */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <Icon name="filter" />
            Filtros de búsqueda
          </div>

          <div style={S.cardBody}>
            <div style={filtersGridStyle}>
              {/* Fecha */}
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
                  max={hoyYmd}
                  onChange={e => {
                    const raw = e.target.value;
                    const v = clampToHoy(raw);
                    setFecha(v);
                    if (v !== raw) setError('No puedes seleccionar fechas futuras.');
                    else if (error === 'No puedes seleccionar fechas futuras.') setError('');
                  }}
                  style={S.control}
                />
              </div>

              {/* Hora */}
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
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edificio */}
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
                      {ed}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salón + limpiar */}
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
                  disabled={filtroEdificio === 'Todos'}
                  title={filtroEdificio === 'Todos' ? 'Selecciona edificio primero' : undefined}
                  style={S.control}
                >
                  {salonesOpciones.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: 10 }}>
                  <button type="button" onClick={limpiarFiltros} style={S.btnSoft(false)}>
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, ...S.rowActions }}>
              <button type="button" onClick={cargar} disabled={loading || saving} style={S.btnSoft(loading || saving)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="reload" />
                  {loading ? 'Actualizando…' : 'Actualizar'}
                </span>
              </button>

              <button
                type="button"
                onClick={guardarCambios}
                disabled={data.length === 0 || loading || saving}
                style={S.btnPrimary(data.length === 0 || loading || saving)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="save" />
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </span>
              </button>
            </div>

            {error && <div style={S.alert('error')}>{error}</div>}
            {mensaje && <div style={S.alert('ok')}>{mensaje}</div>}
          </div>
        </section>

        {/* LISTA */}
        {loading ? (
          <section style={S.card}>
            <div style={S.cardBody}>Cargando...</div>
          </section>
        ) : total === 0 ? (
          <section style={S.card}>
            <div style={S.cardBody}>No hay asistencias con esos filtros.</div>
          </section>
        ) : (
          <div style={S.listWrap}>
            {dataFiltrada.map(a => {
              const profesor = a.profesor ?? 'Sin profesor';
              const edificio = a.edificio ?? '-';
              const salon = a.salon ?? '-';
              const hora = a.horaClase ?? '-';
              const ubicacion = `${edificio}-${salon}`;

              return (
                <article key={a.idAsistencia} style={itemCardStyle}>
                  {/* LEFT */}
                  <div style={S.itemLeft}>
                    <div style={S.leftStripe} />

                    <div style={S.topRow}>
                      <div style={S.iconSquare}>
                        <Icon name="cap" />
                      </div>
                      <div>
                        <p style={S.mainTitle}>Registro de asistencia</p>
                        <div style={S.muted}>ID: {a.idAsistencia}</div>
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
                        <span style={{ fontWeight: 550 }}>{hora}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, color: '#4b5563', fontWeight: 550 }}>
                      <span style={{ color: '#7c3aed' }}>
                        <Icon name="book" />
                      </span>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div style={rightStyle}>
                    <div>
                      <div style={{ ...S.fieldLabelRow, marginBottom: 10 }}>
                        <span style={S.iconBadge('#2563eb')}>
                          <Icon name="book" />
                        </span>
                        Asignar estado
                      </div>

                      <select
                        value={a.estado}
                        onChange={e => handleChange(a.idAsistencia, 'estado', e.target.value)}
                        style={S.control}
                      >
                        {ESTADOS.map(est => (
                          <option key={est} value={est}>
                            {est}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div style={{ ...S.fieldLabelRow, marginBottom: 10 }}>
                        <span style={S.iconBadge('#94a3b8')}>
                          <Icon name="note" />
                        </span>
                        Comentario adicional (opcional)
                      </div>

                      <input
                        value={a.nota ?? ''}
                        onChange={e => handleChange(a.idAsistencia, 'nota', e.target.value)}
                        placeholder="Opcional"
                        style={S.control}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
