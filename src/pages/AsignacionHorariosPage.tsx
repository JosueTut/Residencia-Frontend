// src/pages/AsignacionHorariosPage.tsx
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { getDocentes, type Docente } from '../api/profesores';
import { getHorarios, createHorario, deleteHorario, updateHorario, type Horario } from '../api/horarios';
import { getEdificios } from '../api/edificios';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;

// catálogo mínimo para edificios/salones
type SalonCatalogo = { nombre?: string | null };
type EdificioCatalogo = { nombre?: string | null; salones?: SalonCatalogo[] | null };

// 07:00 a 21:00
const HORAS_CLASE = Array.from({ length: 21 - 7 + 1 }, (_, i) => {
  const h = i + 7;
  return `${String(h).padStart(2, '0')}:00`;
});

const normalize = (v?: string | null) => String(v ?? '').trim().toUpperCase();

const getHorarioId = (h: any): number | null => {
  const raw =
    h?.id ?? h?.id_horario ?? h?.horario_id ?? h?.idHorario ?? h?.idhorario ?? h?.Id ?? h?.ID;

  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const ordenarHorarios = (lista: Horario[]) => {
  const diaIndex = (d?: string | null) => {
    const idx = DIAS_SEMANA.findIndex(x => normalize(x) === normalize(d));
    return idx === -1 ? 999 : idx;
  };

  const getHoraInicio = (hora: string) => {
    const match = String(hora ?? '').match(/(\d{1,2})(?::\d{2})?/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  return [...lista].sort((a, b) => {
    const cmpDia = diaIndex(a.dia_semana) - diaIndex(b.dia_semana);
    if (cmpDia !== 0) return cmpDia;

    const cmpEd = normalize(a.edificio).localeCompare(normalize(b.edificio));
    if (cmpEd !== 0) return cmpEd;

    const cmpA = normalize(a.aula).localeCompare(normalize(b.aula));
    if (cmpA !== 0) return cmpA;

    return getHoraInicio(String(a.hora_clase ?? '')) - getHoraInicio(String(b.hora_clase ?? ''));
  });
};

/** Normaliza strings para comparar sin problemas */
const norm = (v: any) => String(v ?? '').trim().toUpperCase();

/**
 * Detecta choques:
 * - Mismo (dia + hora + edificio + salon)
 * - Mismo (dia + hora + profesor)
 *
 * excludeId: úsalo cuando estás editando, para ignorar ese registro.
 */
const detectarConflicto = (params: {
  horarios: Horario[];
  dia: string;
  hora: string;
  edificio: string;
  salon: string;
  profesorId: number;
  excludeId?: number | null;
}) => {
  const { horarios, dia, hora, edificio, salon, profesorId, excludeId } = params;

  const diaN = norm(dia);
  const horaN = norm(hora);
  const edN = norm(edificio);
  const salonN = norm(salon);

  // helper para sacar id_docente aunque venga con otro nombre
  const getDocenteId = (h: any) => {
    const raw = h?.id_docente ?? h?.docente_id ?? h?.idDocente ?? h?.iddocente;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  for (const h of horarios) {
    const hid = getHorarioId(h as any);
    if (excludeId != null && hid === excludeId) continue;

    const hDia = norm((h as any).dia_semana);
    const hHora = norm((h as any).hora_clase);
    if (hDia !== diaN || hHora !== horaN) continue;

    // Choque por salón
    const hEd = norm((h as any).edificio);
    const hAula = norm((h as any).aula);
    if (hEd === edN && hAula === salonN) {
      return {
        ok: false as const,
        tipo: 'SALON' as const,
        mensaje: `Ya existe un horario en ${dia} ${hora} para ${edificio}-${salon}.`,
      };
    }

    // Choque por profesor
    const hDocenteId = getDocenteId(h as any);
    if (hDocenteId != null && hDocenteId === profesorId) {
      return {
        ok: false as const,
        tipo: 'PROFESOR' as const,
        mensaje: `El profesor ya tiene un horario asignado en ${dia} ${hora}.`,
      };
    }
  }

  return { ok: true as const };
};

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
    | 'trash'
    | 'edit'
    | 'check'
    | 'x';
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
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      );
    default:
      return null;
  }
};

// Styles (match screenshots)
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

  // Ajuste de layout para que TODO quepa dentro del recuadro "Nuevo horario"
  createGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    alignItems: 'end',
  } as const,

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

  btnDanger: (disabled?: boolean) =>
    ({
      padding: '12px 14px',
      borderRadius: 10,
      border: '1px solid #fecaca',
      background: '#fff',
      color: '#b91c1c',
      fontWeight: 550,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.65 : 1,
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

export const AsignacionHorariosPage = () => {
  const [profesores, setProfesores] = useState<Docente[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [edificiosCrud, setEdificiosCrud] = useState<EdificioCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // FORM (crear)
  const [carreraSel, setCarreraSel] = useState<string>('');
  const [profesorId, setProfesorId] = useState<number | ''>('');
  const [diaSemana, setDiaSemana] = useState<(typeof DIAS_SEMANA)[number]>('Lunes');
  const [horaClase, setHoraClase] = useState<string>('');
  const [edificioSel, setEdificioSel] = useState<string>('');
  const [salonSel, setSalonSel] = useState<string>('');

  // EDICIÓN INLINE
  const [editId, setEditId] = useState<number | null>(null);
  const [editProfesorId, setEditProfesorId] = useState<number | ''>('');
  const [editDia, setEditDia] = useState<(typeof DIAS_SEMANA)[number]>('Lunes');
  const [editHora, setEditHora] = useState<string>('');
  const [editEdificioSel, setEditEdificioSel] = useState<string>('');
  const [editSalonSel, setEditSalonSel] = useState<string>('');
  const [editEdificioManual, setEditEdificioManual] = useState<string>(''); // fallback por datos viejos
  const [editSalonManual, setEditSalonManual] = useState<string>(''); // fallback por datos viejos

  // FILTROS
  const [filtroDia, setFiltroDia] = useState<string>('Todos');
  const [filtroEdificio, setFiltroEdificio] = useState<string>('Todos');
  const [filtroHora, setFiltroHora] = useState<string>('Todos');

  // Responsive helper
  const [w, setW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const isSm = w < 720;
  const isMd = w >= 720 && w < 980;

  const createGridStyle = isSm
    ? { ...S.createGrid, gridTemplateColumns: '1fr' }
    : isMd
      ? { ...S.createGrid, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }
      : S.createGrid;

  const filtersGridStyle = isSm
    ? { ...S.filtersGrid, gridTemplateColumns: '1fr' }
    : isMd
      ? { ...S.filtersGrid, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
      : S.filtersGrid;

  const itemCardStyle = isSm ? { ...S.itemCard, gridTemplateColumns: '1fr' } : S.itemCard;
  const rightStyle = isSm ? { ...S.itemRight, borderLeft: 'none', borderTop: '1px solid #eef2ff' } : S.itemRight;
  const infoGridStyle = isSm ? { ...S.infoGrid, gridTemplateColumns: '1fr' } : S.infoGrid;

  /* LOAD */
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setOk('');

      const [profesoresRes, horariosRes, edificiosRes] = await Promise.all([getDocentes(), getHorarios(), getEdificios()]);

      setProfesores((Array.isArray(profesoresRes) ? profesoresRes : []).filter(p => (p as any).activo));
      setHorarios(ordenarHorarios(Array.isArray(horariosRes) ? horariosRes : []));
      setEdificiosCrud(Array.isArray(edificiosRes) ? (edificiosRes as EdificioCatalogo[]) : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar profesores, horarios o edificios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* CARRERAS / PROFES FILTRADOS */
  const carrerasOpciones = useMemo(() => {
    const carreras = profesores.map(p => String((p as any).carrera ?? '').trim()).filter(Boolean);
    return Array.from(new Set(carreras)).sort((a, b) => a.localeCompare(b));
  }, [profesores]);

  const profesoresFiltrados = useMemo(() => {
    if (!carreraSel) return profesores;
    return profesores.filter(p => String((p as any).carrera ?? '').trim() === carreraSel);
  }, [profesores, carreraSel]);

  useEffect(() => {
    setProfesorId('');
  }, [carreraSel]);

  /* OPTIONS (CREATE) */
  const edificiosOpciones = useMemo(() => {
    const nombres = edificiosCrud.map(e => (e.nombre ?? '').trim()).filter(Boolean) as string[];
    return Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b));
  }, [edificiosCrud]);

  const salonesOpciones = useMemo(() => {
    if (!edificioSel) return [];
    const ed = edificiosCrud.find(e => (e.nombre ?? '').trim() === edificioSel);
    const salones = (ed?.salones ?? []).map(s => (s.nombre ?? '').trim()).filter(Boolean) as string[];
    return Array.from(new Set(salones)).sort((a, b) => a.localeCompare(b));
  }, [edificiosCrud, edificioSel]);

  const edificioFinal = edificioSel.trim();
  const salonFinal = salonSel.trim();

  /* OPTIONS (EDIT) */
  const editSalonesOpciones = useMemo(() => {
    if (!editEdificioSel) return [];
    const ed = edificiosCrud.find(e => (e.nombre ?? '').trim() === editEdificioSel);
    const salones = (ed?.salones ?? []).map(s => (s.nombre ?? '').trim()).filter(Boolean) as string[];
    return Array.from(new Set(salones)).sort((a, b) => a.localeCompare(b));
  }, [edificiosCrud, editEdificioSel]);

  const editEdificioFinal = useMemo(() => {
    return editEdificioSel.trim() || editEdificioManual.trim();
  }, [editEdificioSel, editEdificioManual]);

  const editSalonFinal = useMemo(() => {
    return editSalonSel.trim() || editSalonManual.trim();
  }, [editSalonSel, editSalonManual]);

  /* CONFLICTOS */
  const conflictoCrear = useMemo(() => {
    if (!profesorId || !horaClase || !edificioFinal || !salonFinal) return { ok: true as const };
    return detectarConflicto({
      horarios,
      dia: diaSemana,
      hora: horaClase,
      edificio: edificioFinal,
      salon: salonFinal,
      profesorId: Number(profesorId),
    });
  }, [horarios, profesorId, diaSemana, horaClase, edificioFinal, salonFinal]);

  const conflictoEditar = useMemo(() => {
    if (editId == null) return { ok: true as const };
    if (!editProfesorId || !editHora || !editEdificioFinal || !editSalonFinal) return { ok: true as const };
    return detectarConflicto({
      horarios,
      dia: editDia,
      hora: editHora,
      edificio: editEdificioFinal,
      salon: editSalonFinal,
      profesorId: Number(editProfesorId),
      excludeId: editId,
    });
  }, [horarios, editId, editProfesorId, editDia, editHora, editEdificioFinal, editSalonFinal]);

  /* CREATE */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');

    if (!profesorId || !horaClase || !edificioFinal || !salonFinal) {
      setError('Selecciona carrera, profesor, hora, edificio y salón');
      return;
    }

    if (!conflictoCrear.ok) {
      setError(conflictoCrear.mensaje);
      return;
    }

    try {
      setSaving(true);

      const nuevo = await createHorario({
        id_docente: Number(profesorId),
        dia_semana: diaSemana,
        hora_clase: horaClase,
        edificio: edificioFinal,
        aula: salonFinal,
      });

      setHorarios(prev => ordenarHorarios([nuevo, ...prev]));
      setOk('✅ Horario creado correctamente');

      // reset form
      setCarreraSel('');
      setProfesorId('');
      setDiaSemana('Lunes');
      setHoraClase('');
      setEdificioSel('');
      setSalonSel('');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message ?? 'Error al guardar el horario';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  /* EDIT */
  const iniciarEdicion = (h: Horario) => {
    const hid = getHorarioId(h as any);
    if (hid == null) {
      setError('Este horario no tiene ID válido (no se puede editar).');
      return;
    }

    setEditId(hid);
    setError('');
    setOk('');

    setEditProfesorId((h as any).id_docente ?? '');
    setEditDia(((h as any).dia_semana ?? 'Lunes') as any);
    setEditHora((h as any).hora_clase ?? '');

    const ed = (h.edificio ?? '').trim();
    if (ed && edificiosOpciones.includes(ed)) {
      setEditEdificioSel(ed);
      setEditEdificioManual('');
    } else {
      setEditEdificioSel('');
      setEditEdificioManual(ed);
    }

    const aula = (h.aula ?? '').trim();
    const salOpts =
      ed && edificiosOpciones.includes(ed)
        ? (() => {
            const edObj = edificiosCrud.find(x => (x.nombre ?? '').trim() === ed);
            const s = (edObj?.salones ?? []).map(x => (x.nombre ?? '').trim()).filter(Boolean) as string[];
            return Array.from(new Set(s));
          })()
        : [];

    if (aula && salOpts.includes(aula)) {
      setEditSalonSel(aula);
      setEditSalonManual('');
    } else {
      setEditSalonSel('');
      setEditSalonManual(aula);
    }
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditProfesorId('');
    setEditDia('Lunes');
    setEditHora('');
    setEditEdificioSel('');
    setEditSalonSel('');
    setEditEdificioManual('');
    setEditSalonManual('');
  };

  const guardarEdicion = async () => {
    if (editId == null) return;

    setError('');
    setOk('');

    if (!editProfesorId || !editHora || !editEdificioFinal || !editSalonFinal) {
      setError('Selecciona profesor, hora, edificio y salón para guardar cambios.');
      return;
    }

    if (!conflictoEditar.ok) {
      setError(conflictoEditar.mensaje);
      return;
    }

    try {
      setSaving(true);

      const updated = await updateHorario(editId, {
        id_docente: Number(editProfesorId),
        dia_semana: editDia,
        hora_clase: editHora,
        edificio: editEdificioFinal,
        aula: editSalonFinal,
      });

      setHorarios(prev => ordenarHorarios(prev.map(x => (getHorarioId(x as any) === editId ? (updated as any) : x))));
      setOk('✅ Horario actualizado');
      cancelarEdicion();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message ?? 'Error al actualizar el horario';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  /* DELETE */
  const handleDelete = async (id: number | null) => {
    if (id == null) {
      setError('No se pudo eliminar: el horario no tiene un ID válido.');
      return;
    }

    if (!confirm('¿Seguro que quieres eliminar este horario?')) return;

    try {
      setSaving(true);
      setError('');
      setOk('');

      await deleteHorario(id);

      setHorarios(prev => prev.filter(h => getHorarioId(h as any) !== id));
      setOk('✅ Horario eliminado con éxito');
      if (editId === id) cancelarEdicion();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message ?? 'Error al eliminar el horario';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  /* FILTER VIEW */
  const edificiosDisponibles = useMemo(() => {
    return Array.from(new Set(horarios.map(h => (h.edificio ?? '').trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [horarios]);

  const horasDisponibles = useMemo(() => {
    return Array.from(new Set(horarios.map(h => (h.hora_clase ?? '').trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [horarios]);

  const limpiarFiltros = () => {
    setFiltroDia('Todos');
    setFiltroEdificio('Todos');
    setFiltroHora('Todos');
  };

  const horariosFiltrados = useMemo(() => {
    const base = ordenarHorarios(horarios);

    return base.filter(h => {
      if (filtroDia !== 'Todos' && (h.dia_semana ?? '') !== filtroDia) return false;
      if (filtroEdificio !== 'Todos' && (h.edificio ?? '') !== filtroEdificio) return false;
      if (filtroHora !== 'Todos' && (h.hora_clase ?? '') !== filtroHora) return false;
      return true;
    });
  }, [horarios, filtroDia, filtroEdificio, filtroHora]);

  const total = horariosFiltrados.length;

  if (loading) return <p style={{ padding: 24 }}>Cargando datos...</p>;

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
                <h1 style={S.h1}>Asignación de horarios</h1>
                <div style={S.sub}>Crea, edita y elimina horarios.</div>
              </div>
            </div>

            <div style={S.heroChip}>
              <Icon name="book" />
              <span style={{ fontWeight: 550 }}>{total}</span>
              <span style={{ opacity: 0.9, fontWeight: 550 }}>registros</span>
            </div>
          </div>
        </header>

        {/* CREAR HORARIO */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <Icon name="calendar" />
            Nuevo horario
          </div>

          <div style={S.cardBody}>
            <form id="horarios-form" onSubmit={handleSubmit}>
              <div style={createGridStyle}>
                {/* Carrera */}
                <div style={{ gridColumn: isSm ? 'auto' : isMd ? 'span 1' : 'span 2' }}>
                  <div style={S.fieldLabelRow}>
                    <span style={S.iconBadge('#7c3aed')}>
                      <Icon name="book" />
                    </span>
                    Carrera
                  </div>
                  <select value={carreraSel} onChange={e => setCarreraSel(e.target.value)} style={S.control}>
                    <option value="">Todas / Selecciona</option>
                    {carrerasOpciones.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profesor */}
                <div style={{ gridColumn: isSm ? 'auto' : isMd ? 'span 2' : 'span 2' }}>
                  <div style={S.fieldLabelRow}>
                    <span style={S.iconBadge('#2563eb')}>
                      <Icon name="user" />
                    </span>
                    Profesor
                  </div>
                  <select
                    value={profesorId}
                    onChange={e => setProfesorId(e.target.value === '' ? '' : Number(e.target.value))}
                    style={S.control}
                  >
                    <option value="">Selecciona un profesor</option>
                    {profesoresFiltrados.map(p => (
                      <option key={p.id_docente} value={p.id_docente}>
                        {p.nombre} ({(p as any).carrera})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Día */}
                <div style={{ gridColumn: isSm ? 'auto' : 'span 1' }}>
                  <div style={S.fieldLabelRow}>
                    <span style={S.iconBadge('#7c3aed')}>
                      <Icon name="calendar" />
                    </span>
                    Día
                  </div>
                  <select value={diaSemana} onChange={e => setDiaSemana(e.target.value as any)} style={S.control}>
                    {DIAS_SEMANA.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hora */}
                <div style={{ gridColumn: isSm ? 'auto' : 'span 1' }}>
                  <div style={S.fieldLabelRow}>
                    <span style={S.iconBadge('#ea580c')}>
                      <Icon name="clock" />
                    </span>
                    Hora
                  </div>
                  <select value={horaClase} onChange={e => setHoraClase(e.target.value)} style={S.control}>
                    <option value="">Selecciona hora</option>
                    {HORAS_CLASE.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Edificio */}
                <div style={{ gridColumn: isSm ? 'auto' : 'span 1' }}>
                  <div style={S.fieldLabelRow}>
                    <span style={S.iconBadge('#059669')}>
                      <Icon name="building" />
                    </span>
                    Edificio
                  </div>
                  <select
                    value={edificioSel}
                    onChange={e => {
                      const v = e.target.value;
                      setEdificioSel(v);
                      setSalonSel('');
                    }}
                    style={S.control}
                  >
                    <option value="">Selecciona edificio</option>
                    {edificiosOpciones.map(ed => (
                      <option key={ed} value={ed}>
                        {ed}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salón */}
                <div style={{ gridColumn: isSm ? 'auto' : 'span 1' }}>
                  <div style={S.fieldLabelRow}>
                    <span style={S.iconBadge('#2563eb')}>
                      <Icon name="pin" />
                    </span>
                    Salón
                  </div>

                  <select
                    value={salonSel}
                    onChange={e => setSalonSel(e.target.value)}
                    style={S.control}
                    disabled={!edificioFinal}
                    title={!edificioFinal ? 'Selecciona edificio primero' : undefined}
                  >
                    <option value="">{edificioFinal ? 'Selecciona salón' : 'Selecciona edificio primero'}</option>
                    {salonesOpciones.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 14, ...S.rowActions }}>
                <button type="button" onClick={loadData} disabled={saving} style={S.btnSoft(saving)}>
                  Recargar
                </button>

                <button
                  type="submit"
                  disabled={saving || !profesorId || !horaClase || !edificioFinal || !salonFinal || !conflictoCrear.ok}
                  style={S.btnPrimary(saving || !profesorId || !horaClase || !edificioFinal || !salonFinal || !conflictoCrear.ok)}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>

              {error && <div style={S.alert('error')}>{error}</div>}
              {ok && <div style={S.alert('ok')}>{ok}</div>}
              {!conflictoCrear.ok && <div style={S.alert('error')}>{conflictoCrear.mensaje}</div>}
            </form>
          </div>
        </section>

        {/* FILTROS LISTA */}
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
                  Día
                </div>
                <select value={filtroDia} onChange={e => setFiltroDia(e.target.value)} style={S.control}>
                  <option value="Todos">Todos</option>
                  {DIAS_SEMANA.map(d => (
                    <option key={d} value={d}>
                      {d}
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
                <select value={filtroEdificio} onChange={e => setFiltroEdificio(e.target.value)} style={S.control}>
                  <option value="Todos">Todos</option>
                  {edificiosDisponibles.map(ed => (
                    <option key={ed} value={ed}>
                      {ed}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#ea580c')}>
                    <Icon name="clock" />
                  </span>
                  Hora
                </div>
                <select value={filtroHora} onChange={e => setFiltroHora(e.target.value)} style={S.control}>
                  <option value="Todos">Todas</option>
                  {horasDisponibles.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ height: 40 }} />
                <button type="button" onClick={limpiarFiltros} style={S.btnSoft(false)}>
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* LISTA */}
        {horariosFiltrados.length === 0 ? (
          <section style={S.card}>
            <div style={S.cardBody}>No hay horarios registrados con esos filtros.</div>
          </section>
        ) : (
          <div style={S.listWrap}>
            {horariosFiltrados.map(h => {
              const hid = getHorarioId(h as any);
              const canActions = hid != null && !saving;
              const editing = editId != null && hid != null && editId === hid;

              const profesorNombre = (h as any).docente?.nombre ?? 'Sin profesor';
              const profesorCarrera = (h as any).docente?.carrera ?? '';
              const dia = (h as any).dia_semana ?? '';
              const hora = (h as any).hora_clase ?? '';
              const edificio = (h.edificio ?? '-').toString();
              const aula = (h.aula ?? '-').toString();
              const ubicacion = `${edificio}-${aula}`;

              return (
                <article key={hid ?? `${dia}-${hora}-${edificio}-${aula}`} style={itemCardStyle}>
                  {/* LEFT */}
                  <div style={S.itemLeft}>
                    <div style={S.leftStripe} />

                    <div style={S.topRow}>
                      <div style={S.iconSquare}>
                        <Icon name="cap" />
                      </div>
                      <div>
                        <p style={S.mainTitle}>{dia}</p>
                        <div style={S.muted}>ID: {hid ?? '—'}</div>
                      </div>
                    </div>

                    <div style={infoGridStyle}>
                      <div style={S.pillRow}>
                        <Icon name="user" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {profesorNombre}
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

                    <div
                      style={{
                        marginTop: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: '#4b5563',
                        fontWeight: 550,
                      }}
                    >
                      <span style={{ color: '#7c3aed' }}>
                        <Icon name="book" />
                      </span>
                      <span style={{ opacity: 0.8 }}>{profesorCarrera}</span>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div style={rightStyle}>
                    {editing ? (
                      <>
                        <select
                          style={S.control}
                          value={editProfesorId}
                          onChange={e => setEditProfesorId(e.target.value === '' ? '' : Number(e.target.value))}
                        >
                          <option value="">Selecciona un profesor</option>
                          {profesores.map(p => (
                            <option key={p.id_docente} value={p.id_docente}>
                              {p.nombre} ({(p as any).carrera})
                            </option>
                          ))}
                        </select>

                        <select style={S.control} value={editDia} onChange={e => setEditDia(e.target.value as any)}>
                          {DIAS_SEMANA.map(d => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>

                        <select style={S.control} value={editHora} onChange={e => setEditHora(e.target.value)}>
                          <option value="">Selecciona hora</option>
                          {HORAS_CLASE.map(hh => (
                            <option key={hh} value={hh}>
                              {hh}
                            </option>
                          ))}
                        </select>

                        <select
                          style={S.control}
                          value={editEdificioSel}
                          onChange={e => {
                            const v = e.target.value;
                            setEditEdificioSel(v);
                            setEditSalonSel('');
                            setEditSalonManual('');
                          }}
                        >
                          <option value="">Selecciona edificio</option>
                          {edificiosOpciones.map(ed => (
                            <option key={ed} value={ed}>
                              {ed}
                            </option>
                          ))}
                        </select>

                        <select
                          style={S.control}
                          value={editSalonSel}
                          onChange={e => setEditSalonSel(e.target.value)}
                          disabled={!editEdificioFinal}
                          title={!editEdificioFinal ? 'Selecciona edificio primero' : undefined}
                        >
                          <option value="">
                            {editEdificioFinal ? 'Selecciona salón' : 'Selecciona edificio primero'}
                          </option>
                          {editSalonesOpciones.map(s => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        {/* Avisos por datos viejos fuera del CRUD */}
                        {editEdificioSel === '' && editEdificioManual && (
                          <div style={{ ...S.alert('error'), marginTop: 0 }}>
                            Este registro trae un edificio fuera del CRUD: <b>{editEdificioManual}</b>. Selecciona uno
                            válido para corregirlo.
                          </div>
                        )}
                        {editSalonSel === '' && editSalonManual && (
                          <div style={{ ...S.alert('error'), marginTop: 0 }}>
                            Este registro trae un salón fuera del CRUD: <b>{editSalonManual}</b>. Selecciona uno válido
                            para corregirlo.
                          </div>
                        )}

                        {!conflictoEditar.ok && <div style={{ ...S.alert('error'), marginTop: 0 }}>{conflictoEditar.mensaje}</div>}

                        <div style={S.rowActions}>
                          <button
                            type="button"
                            onClick={guardarEdicion}
                            disabled={
                              saving ||
                              !editProfesorId ||
                              !editHora ||
                              !editEdificioFinal ||
                              !editSalonFinal ||
                              !conflictoEditar.ok
                            }
                            style={S.btnPrimary(
                              saving ||
                                !editProfesorId ||
                                !editHora ||
                                !editEdificioFinal ||
                                !editSalonFinal ||
                                !conflictoEditar.ok,
                            )}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <Icon name="check" />
                              Guardar
                            </span>
                          </button>

                          <button type="button" onClick={cancelarEdicion} disabled={saving} style={S.btnSoft(saving)}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <Icon name="x" />
                              Cancelar
                            </span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(h)}
                          disabled={!canActions}
                          style={S.btnSoft(!canActions)}
                          title={hid == null ? 'Este horario no tiene ID válido' : undefined}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Icon name="edit" />
                            Editar
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(hid)}
                          disabled={!canActions}
                          style={S.btnDanger(!canActions)}
                          title={hid == null ? 'Este horario no tiene ID válido' : undefined}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Icon name="trash" />
                            Eliminar
                          </span>
                        </button>
                      </>
                    )}
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
