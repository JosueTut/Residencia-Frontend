// src/pages/ReporteAsistenciasPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { getAsistenciasPorRango, type ReporteAsistenciaItem } from '../api/asistencias';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/authContext';

// ===============================
// Helpers: estado -> código
// ===============================
const normalizeText = (v?: string) => String(v ?? '').toUpperCase().trim();

const estadoToCodigo = (estadoRaw?: string) => {
  const e = normalizeText(estadoRaw);

  const MAP: Record<string, string> = {
    PRESENTE: 'P',
    AUSENTE: 'A',
    INCAPACIDAD: 'I',
    COMISION: 'C',
    RETARDO: 'R',
    SUSPENDIDO: 'S',
    JUSTIFICANTE_MEDICO: 'JM',
    JUSTIFICADO: 'J',
    JUSTIFICANTE: 'J',
    JM: 'JM',
  };

  return MAP[e] ?? (e ? e.slice(0, 3) : '');
};

// ===============================
// Helpers: código -> texto (para mostrar en PDF)
// ===============================
const CODIGO_LABEL: Record<string, string> = {
  P: 'Presente',
  A: 'Ausente',
  R: 'Retardo',
  C: 'Comisión',
  I: 'Incapacidad',
  JM: 'Justificante médico',
  S: 'Suspendido',
};

const codigoToLabel = (codigo?: string) => {
  const c = normalizeText(codigo);
  return CODIGO_LABEL[c] ?? '';
};

const codeWithLabel = (codigo?: string) => {
  const c = String(codigo ?? '').trim();
  if (!c) return '';
  const label = codigoToLabel(c);
  return label ? `${c} (${label})` : c;
};


// ===============================
// Date helpers (YYYY-MM-DD)
// ===============================
const pad2 = (n: number) => String(n).padStart(2, '0');
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYMD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};
const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

// ===============================
// Bloqueo de fechas futuras (YYYY-MM-DD)
// ===============================
const todayYMD = () => toYMD(new Date()); // ✅ hoy en horario local
const isFutureYMD = (ymd?: string) => {
  const t = todayYMD();
  const v = String(ymd ?? '').slice(0, 10);
  return Boolean(v) && v > t;
};
const clampToTodayYMD = (ymd?: string) => {
  const t = todayYMD();
  const v = String(ymd ?? '').slice(0, 10);
  if (!v) return v;
  return v > t ? t : v;
};


const getDatesBetweenInclusive = (startYmd: string, endYmd: string) => {
  const start = parseYMD(startYmd);
  const end = parseYMD(endYmd);
  const out: { ymd: string; d: Date }[] = [];
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;

  const dir = start <= end ? 1 : -1;
  let cur = start;
  while ((dir === 1 && cur <= end) || (dir === -1 && cur >= end)) {
    out.push({ ymd: toYMD(cur), d: new Date(cur) });
    cur = addDays(cur, dir);
  }
  return out;
};

// LUN..DOM (ISO)
const isoWeekday = (d: Date) => {
  const day = d.getDay(); // DOM=0 ... SAB=6
  return day === 0 ? 7 : day; // DOM -> 7
};

const startOfIsoWeek = (d: Date) => {
  const x = new Date(d);
  const wd = isoWeekday(x); // 1..7
  x.setDate(x.getDate() - (wd - 1)); // lunes
  x.setHours(0, 0, 0, 0);
  return x;
};

const groupDatesByIsoWeek = (dates: { ymd: string; d: Date }[]) => {
  if (!dates.length) return [];
  const sorted = [...dates].sort((a, b) => a.ymd.localeCompare(b.ymd));
  const weeks: Array<{ key: string; start: Date; end: Date; days: { ymd: string; d: Date }[] }> = [];

  let curWeekStart = startOfIsoWeek(sorted[0].d);
  let bucket: { ymd: string; d: Date }[] = [];

  const pushWeek = () => {
    if (!bucket.length) return;
    const start = startOfIsoWeek(bucket[0].d);
    const end = addDays(start, 6);
    weeks.push({
      key: toYMD(start),
      start,
      end,
      days: bucket,
    });
  };

  for (const item of sorted) {
    const wStart = startOfIsoWeek(item.d);
    if (toYMD(wStart) !== toYMD(curWeekStart)) {
      pushWeek();
      bucket = [];
      curWeekStart = wStart;
    }
    bucket.push(item);
  }
  pushWeek();

  return weeks;
};

const weekdayShortEs = (d: Date) => {
  const map = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  return map[d.getDay()] ?? '';
};

const weekdayLongEs = (d: Date) => {
  const map = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return map[d.getDay()] ?? '';
};

type ResumenSortKey =
  | 'profesor'
  | 'P'
  | 'A'
  | 'C'
  | 'I'
  | 'R'
  | 'S'
  | 'JM'
  | 'asistenciaPct'
  | 'asistenciaFrac';

type ResumenSortDir = 'asc' | 'desc';

// ===============================
// Icons (SVG inline)
// ===============================
const Icon = ({
  name,
}: {
  name:
    | 'cap'
    | 'filter'
    | 'calendar'
    | 'building'
    | 'user'
    | 'book'
    | 'pin'
    | 'clock'
    | 'doc'
    | 'download'
    | 'trash'
    | 'reload'
    | 'list'
    | 'close'
    | 'note'
    | 'file';
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
    case 'doc':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8M8 17h8M8 9h2" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5" />
          <path d="M12 15V3" />
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
    case 'list':
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      );
    case 'note':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case 'file':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    default:
      return null;
  }
};

// ===============================
// Styles (MISMO DISEÑO)
// ===============================
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
    justifyContent: 'space-between',
    gap: 10,
    fontWeight: 550,
    color: '#0b3fa5',
  } as const,

  cardBody: { padding: 16 } as const,

  grid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
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

  btnMini: (active?: boolean) =>
    ({
      padding: '8px 10px',
      borderRadius: 12,
      border: '1px solid #dbe3f1',
      background: active ? 'rgba(37,99,235,.12)' : '#fff',
      color: '#0b3fa5',
      fontWeight: 550,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    } as const),

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
    minWidth: 980,
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
    zIndex: 2,
    userSelect: 'none' as const,
  } as const,

  thSortable: { cursor: 'pointer' } as const,

  thActive: {
    background: '#eef6ff',
    color: '#0b3fa5',
    borderBottom: '1px solid #dbe7ff',
  } as const,

  td: {
    padding: '12px 12px',
    borderBottom: '1px solid #f1f5f9',
    color: '#0f172a',
    verticalAlign: 'middle' as const,
    fontWeight: 550,
  } as const,

  muted: { fontSize: 12, opacity: 0.75, fontWeight: 550 } as const,

  pagerRow: {
    marginTop: 12,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
  } as const,

  pager: { display: 'flex', gap: 8, alignItems: 'center' } as const,

  pagerBtn: (disabled?: boolean) =>
    ({
      padding: '10px 12px',
      borderRadius: 12,
      border: '1px solid #dbe3f1',
      background: '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      fontWeight: 550,
    } as const),

  pagerInfo: {
    minWidth: 160,
    textAlign: 'center' as const,
    color: '#334155',
    fontWeight: 550,
  } as const,

  codeLegend: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
    marginTop: 12,
  } as const,

  badgeCode: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid #dbe3f1',
    background: '#fff',
    boxShadow: '0 10px 26px rgba(2,6,23,.06)',
    fontWeight: 550,
  } as const,

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: '#2563eb',
    boxShadow: '0 0 0 6px rgba(37,99,235,.12)',
  } as const,

  // Bloque calendario
  calWrap: {
    overflowX: 'auto' as const,
    borderRadius: 14,
    border: '1px solid #dbe3f1',
    background: '#fff',
    boxShadow: '0 12px 30px rgba(2,6,23,.08)',
  } as const,

  calTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    minWidth: 980,
  } as const,

  calTh: {
    padding: '8px 10px',
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.7,
    color: '#334155',
    background: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky' as const,
    top: 0,
    zIndex: 2,
    whiteSpace: 'nowrap' as const,
  } as const,

  calThDate: {
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 550,
    color: '#0b3fa5',
    background: '#eef6ff',
    borderBottom: '1px solid #dbe7ff',
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
    minWidth: 92,
  } as const,

  calTd: {
    padding: '8px 10px',
    borderBottom: '1px solid #eef2f7',
    fontWeight: 550,
    fontSize: 14,
    whiteSpace: 'nowrap' as const,
  } as const,

  calCell: {
    padding: '8px 8px',
    borderBottom: '1px solid #eef2f7',
    textAlign: 'center' as const,
    fontWeight: 550,
    fontSize: 12,
    minWidth: 92,
    verticalAlign: 'top' as const,
  } as const,

  noteText: {
    display: 'block',
    marginTop: 6,
    fontSize: 12,
    fontWeight: 550,
    color: '#334155',
    opacity: 0.9,
    lineHeight: 1.2,
    maxWidth: 86,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  } as const,

  codeStyle: (code: string) => {
    const c = normalizeText(code);
    const base = {
      borderRadius: 8,
      border: '1px solid rgba(2,6,23,.10)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 28,
      fontWeight: 550,
    } as const;

    switch (c) {
      case 'P':
        return { ...base, background: 'rgba(37,99,235,.14)', color: '#1d4ed8', borderColor: 'rgba(37,99,235,.25)' };
      case 'A':
        return { ...base, background: 'rgba(239,68,68,.14)', color: '#b91c1c', borderColor: 'rgba(239,68,68,.25)' };
      case 'R':
        return { ...base, background: 'rgba(245,158,11,.18)', color: '#92400e', borderColor: 'rgba(245,158,11,.30)' };
      case 'C':
        return { ...base, background: 'rgba(34,197,94,.16)', color: '#166534', borderColor: 'rgba(34,197,94,.28)' };
      case 'I':
        return { ...base, background: 'rgba(100,116,139,.16)', color: '#334155', borderColor: 'rgba(100,116,139,.30)' };
      case 'JM':
        return { ...base, background: 'rgba(139,92,246,.16)', color: '#5b21b6', borderColor: 'rgba(139,92,246,.30)' };
      case 'S':
        return { ...base, background: 'rgba(2,6,23,.10)', color: '#0f172a', borderColor: 'rgba(2,6,23,.20)' };
      default:
        return { ...base, background: 'rgba(2,6,23,.06)', color: '#0f172a', borderColor: 'rgba(2,6,23,.10)' };
    }
  },

  // Modal (simple, sin cambiar diseño de tablas)
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(2,6,23,.55)',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    zIndex: 100,
  } as const,

  modalCard: {
    width: 'min(760px, 100%)',
    background: '#fff',
    borderRadius: 16,
    border: '1px solid rgba(2,6,23,.12)',
    boxShadow: '0 22px 60px rgba(2,6,23,.25)',
    overflow: 'hidden' as const,
  } as const,

  modalHead: {
    padding: '14px 16px',
    background: '#eef6ff',
    borderBottom: '1px solid #dbe7ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    color: '#0b3fa5',
    fontWeight: 550,
  } as const,

  modalBody: { padding: 16 } as const,

  modalGrid: {
    marginTop: 12,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  } as const,

  modalBox: {
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 12,
    background: '#fff',
  } as const,

  modalLabel: { fontSize: 12, opacity: 0.75, fontWeight: 550 } as const,
  modalValue: { marginTop: 6, fontWeight: 550, color: '#0f172a' } as const,
};

// ===============================
// Export helpers (CSV + Excel simple)
// ===============================
const downloadBlob = (filename: string, mime: string, content: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const csvEscape = (v: any) => {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const toTime = (v?: string | null) => {
  if (!v) return '';

  const s = String(v).trim();

  // ✅ Si viene como TIME de BD: "HH:mm" o "HH:mm:ss"
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    // devuelve HH:mm:ss o HH:mm según venga
    return s.length >= 8 ? s.slice(0, 8) : s;
  }

  // ✅ Si viene como ISO datetime
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return '';

  return dt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};


const toHHmm = (v?: string | null) => {
  if (!v) return '';

  const s = String(v).trim();

  // ✅ Si viene como TIME de BD: "HH:mm" o "HH:mm:ss"
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    return s.slice(0, 5); // HH:mm
  }

  // ✅ Si viene como ISO datetime
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return '';

  return dt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};



// ===============================
// PDF helpers (estilo + footer + KPIs + notas)
// ===============================
const fmtPct = (n: number) => `${Math.round(n)}%`;

const safeFileName = (s: string) =>
  String(s ?? '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');

const truncate = (s: any, max = 45) => {
  const x = String(s ?? '');
  return x.length > max ? x.slice(0, max) + '…' : x;
};

const addPdfHeader = (doc: jsPDF, opts: { title: string; lines: string[] }) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(opts.title, 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  let y = 20;
  for (const line of opts.lines) {
    doc.text(line, 14, y);
    y += 5;
  }

  // separador
  doc.setDrawColor(180);
  doc.line(14, y + 2, doc.internal.pageSize.getWidth() - 14, y + 2);

  return y + 8; // startY sugerido
};

const attachFooterForAutoTable = (doc: jsPDF, footerTextLeft: string) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  return () => {
    doc.setFontSize(9);
    doc.setDrawColor(160);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);
    doc.text(footerTextLeft, 14, pageH - 8);
  };
};

const finalizePdfPageNumbers = (doc: jsPDF) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${total}`, pageW - 14, pageH - 8, { align: 'right' });
  }
};

const calcGlobalStats = (items: ReporteAsistenciaItem[]) => {
  const codigos = ['P', 'A', 'R', 'C', 'I', 'JM', 'S'];
  const counts: Record<string, number> = {};
  let asistidas = 0;

  for (const r of items) {
    const code = estadoToCodigo((r as any).estado);
    if (code) counts[code] = (counts[code] ?? 0) + 1;
    if (code === 'P') asistidas += 1;
  }

  const total = items.length;
  const pct = total > 0 ? (asistidas / total) * 100 : 0;

  return { codigos, counts, total, asistidas, pct };
};

// Notas numeradas (para profesor)
type PdfNote = {
  n: number;
  fecha: string;
  carrera: string;
  edificio: string;
  salon: string;
  horaClase: string;
  horaRegistro: string;
  estado: string;
  codigo: string;
  nota: string;
};


const collectProfessorNotes = (detalle: ReporteAsistenciaItem[]) => {
  const notes: PdfNote[] = [];
  let n = 1;

  for (const r of detalle) {
    const nota = String((r as any).notaAdicional ?? '').trim();
    if (!nota) continue;

    const estado = String((r as any).estado ?? '');
    const codigo = estadoToCodigo(estado);

    notes.push({
      n: n++,
      fecha: String((r as any).fecha ?? ''),
      carrera: String(r.carrera ?? ''),
      edificio: String(r.edificio ?? ''),
      salon: String(r.salon ?? ''),
      horaClase: String(r.horaClase ?? ''),
      horaRegistro: toHHmm((r as any).horaRegistro ?? null),
      estado,
      codigo,
      nota,
    });
  }

  return notes;
};

// Mapa para marcar en calendario (fecha|carrera|edif|salon|hora -> noteNumber)
const buildNoteIndexMap = (notes: PdfNote[]) => {
  const m = new Map<string, number>();
  for (const it of notes) {
    const key = `${it.fecha}|${normalizeText(it.carrera)}|${normalizeText(it.edificio)}|${normalizeText(it.salon)}|${normalizeText(it.horaClase)}`;
    if (!m.has(key)) m.set(key, it.n);
  }
  return m;
};

const buildCalendarRowsForPdf = (items: ReporteAsistenciaItem[], dates: { ymd: string; d: Date }[]) => {
  const rows = buildCalendarRows(items, dates);
  return rows;
};

const addProfessorCalendarPdf = (
  doc: jsPDF,
  opts: {
    profesor: string;
    fechaInicio: string;
    fechaFin: string;
    detalle: ReporteAsistenciaItem[];
    notesMap: Map<string, number>;
  },
) => {
  const dates = getDatesBetweenInclusive(opts.fechaInicio, opts.fechaFin);
  const weeks = groupDatesByIsoWeek(dates);
  const rows = buildCalendarRowsForPdf(opts.detalle, dates);

  if (!weeks.length || !rows.length) return;

  // Cada semana = una tabla (landscape)
  for (let i = 0; i < weeks.length; i++) {
    const wk = weeks[i];

    doc.addPage('a4', 'landscape');

    const startY = addPdfHeader(doc, {
      title: `Calendario (Semana ${i + 1})`,
      lines: [
        `Profesor: ${opts.profesor}`,
        `Rango: ${opts.fechaInicio === opts.fechaFin ? opts.fechaInicio : `${opts.fechaInicio} → ${opts.fechaFin}`}`,
        `Semana: ${toYMD(wk.start)} → ${toYMD(wk.end)}`,
        `* = tiene nota`,
      ],
    });

    const head = [['Carrera', 'Edif.', 'Salón', 'Hora', ...wk.days.map(d => `${weekdayShortEs(d.d)} ${d.d.getDate()}`)]];

    const body = rows.map(r => {
      const base = [r.carrera || '-', r.edificio || '-', r.salon || '-', r.hora || '-'];

      const cells = wk.days.map(d => {
        const cell = r.byDate[d.ymd] ?? { code: '', note: '' };
        const code = String(cell.code ?? '');

        if (!code) return '—';

        const key = `${d.ymd}|${normalizeText(r.carrera)}|${normalizeText(r.edificio)}|${normalizeText(r.salon)}|${normalizeText(r.hora)}`;
        const noteN = opts.notesMap.get(key);
        return noteN ? `${code}*` : code;
      });

      return [...base, ...cells];
    });

    autoTable(doc, {
      startY,
      head,
      body,
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      headStyles: { fontSize: 8, fillColor: [238, 246, 255], textColor: [11, 63, 165] },
      alternateRowStyles: { fillColor: [251, 253, 255] },
      margin: { left: 10, right: 10, bottom: 18 },
      didDrawPage: attachFooterForAutoTable(doc, `Calendario · ${opts.profesor}`),
    });
  }
};

// ===============================
// Calendar build (con notas + item para modal)
// ===============================
type CalCell = { code: string; note: string; item?: ReporteAsistenciaItem | null };
type CalRow = {
  key: string;
  carrera: string;
  edificio: string;
  salon: string;
  hora: string;
  byDate: Record<string, CalCell>; // ymd -> {code,note,item}
};

function buildCalendarRows(items: ReporteAsistenciaItem[], dates: { ymd: string; d: Date }[]): CalRow[] {
  const map = new Map<string, CalRow>();

  const priority = (c: string) => {
    const x = normalizeText(c);
    if (x === 'A') return 100;
    if (x === 'R') return 90;
    if (x === 'I') return 80;
    if (x === 'C') return 70;
    if (x === 'JM') return 60;
    if (x === 'S') return 50;
    if (x === 'P') return 10;
    return 1;
  };

  for (const it of items) {
    const carrera = String(it.carrera ?? '');
    const edificio = String(it.edificio ?? '');
    const salon = String(it.salon ?? '');
    const hora = String(it.horaClase ?? '');

    const key = `${normalizeText(carrera)}|${normalizeText(edificio)}|${normalizeText(salon)}|${normalizeText(hora)}`;

    if (!map.has(key)) {
      map.set(key, { key, carrera, edificio, salon, hora, byDate: {} });
    }

    const row = map.get(key)!;
    const fecha = String((it as any).fecha ?? '');
    if (!fecha) continue;

    const code = estadoToCodigo((it as any).estado);
    const note = String((it as any).notaAdicional ?? '').trim();

    const prev = row.byDate[fecha];
    if (!prev) {
      row.byDate[fecha] = { code, note, item: it };
    } else {
      if (priority(code) > priority(prev.code)) row.byDate[fecha] = { code, note, item: it };
      else if (priority(code) === priority(prev.code) && !prev.note && note)
        row.byDate[fecha] = { code: prev.code, note, item: prev.item ?? it };
    }
  }

  const rows = Array.from(map.values()).sort((a, b) => {
    const k1 = `${normalizeText(a.carrera)}|${normalizeText(a.edificio)}|${normalizeText(a.salon)}|${normalizeText(a.hora)}`;
    const k2 = `${normalizeText(b.carrera)}|${normalizeText(b.edificio)}|${normalizeText(b.salon)}|${normalizeText(b.hora)}`;
    return k1.localeCompare(k2);
  });

  for (const r of rows) {
    for (const d of dates) {
      if (!(d.ymd in r.byDate)) r.byDate[d.ymd] = { code: '', note: '', item: null };
    }
  }

  return rows;
}

// ===============================
// Modal info
// ===============================
type NoteModalInfo = {
  profesor: string;
  fechaYmd: string;
  fechaLabel: string;
  diaLabel: string;
  carrera: string;
  edificio: string;
  salon: string;
  horaClase: string;
  horaRegistro: string;
  estadoTexto: string;
  codigo: string;
  nota: string;
} | null;

// ===============================
// Calendario por semanas (tablas apiladas)
// ===============================
const ProfessorCalendarWeekly = ({
  profesor,
  fechaInicio,
  fechaFin,
  detalle,
  onOpenCell,
}: {
  profesor: string;
  fechaInicio: string;
  fechaFin: string;
  detalle: ReporteAsistenciaItem[];
  onOpenCell: (info: NoteModalInfo) => void;
}) => {
  const dates = useMemo(() => getDatesBetweenInclusive(fechaInicio, fechaFin), [fechaInicio, fechaFin]);
  const weeks = useMemo(() => groupDatesByIsoWeek(dates), [dates]);
  const rows = useMemo(() => buildCalendarRows(detalle, dates), [detalle, dates]);

  const open = (ymd: string, d: Date, row: CalRow, cell: CalCell) => {

    if (isFutureYMD(ymd)) return;

    const it = cell.item ?? null;

    const estadoTexto = String((it as any)?.estado ?? '');
    const nota = String(cell.note ?? '').trim();
    const codigo = String(cell.code ?? '');

    const carrera = row.carrera ?? '';
    const edificio = row.edificio ?? '';
    const salon = row.salon ?? '';
    const horaClase = row.hora ?? '';
    const horaRegistro = toHHmm((it as any)?.horaRegistro ?? null);

    onOpenCell({
      profesor,
      fechaYmd: ymd,
      fechaLabel: `${ymd}`,
      diaLabel: weekdayLongEs(d),
      carrera,
      edificio,
      salon,
      horaClase,
      horaRegistro,
      estadoTexto,
      codigo,
      nota,
    });
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid #dbe3f1',
          background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
          boxShadow: '0 12px 30px rgba(2,6,23,.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#eef6ff',
            borderBottom: '1px solid #dbe7ff',
            color: '#0b3fa5',
            fontWeight: 550,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(37,99,235,.12)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name="calendar" />
            </span>
            <div>
              <div style={{ fontSize: 15 }}>Calendario tipo Excel (por semanas)</div>
              <div style={{ fontSize: 12, fontWeight: 550, opacity: 0.9 }}>
                {profesor} · {fechaInicio === fechaFin ? fechaInicio : `${fechaInicio} → ${fechaFin}`}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 550, opacity: 0.95 }}>Registros: {detalle.length}</div>
        </div>

        <div style={{ padding: 14 }}>
          {/* Leyenda */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['P', 'Presente'],
              ['A', 'Ausente'],
              ['R', 'Retardo'],
              ['C', 'Comisión'],
              ['I', 'Incapacidad'],
              ['JM', 'Justificante médico'],
              ['S', 'Suspendido'],
            ].map(([c, t]) => (
              <div
                key={c}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  fontWeight: 550,
                }}
              >
                <span style={S.codeStyle(c)}>{c}</span>
                <span style={{ fontSize: 12, opacity: 0.85 }}>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            {dates.length === 0 ? (
              <div>No hay rango válido.</div>
            ) : rows.length === 0 ? (
              <div>No hay registros para este profesor en el rango.</div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {weeks.map((wk, idx) => (
                  <div key={wk.key}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 550, color: '#0f172a' }}>
                        Semana {idx + 1}
                        <span style={{ opacity: 0.75, fontWeight: 550 }}>
                          {' '}
                          · {toYMD(wk.start)} → {toYMD(wk.end)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 550, opacity: 0.75 }}>
                        (Mostrando {wk.days.length} día(s) del rango)
                      </div>
                    </div>

                    <div style={S.calWrap}>
                      <table style={S.calTable}>
                        <thead>
                          <tr>
                            <th style={S.calTh}>Carrera</th>
                            <th style={S.calTh}>Edif.</th>
                            <th style={S.calTh}>Salón</th>
                            <th style={S.calTh}>Hora</th>

                            {wk.days.map(d => (
                              <th key={d.ymd} style={S.calThDate}>
                                <div style={{ fontSize: 11, fontWeight: 550 }}>{weekdayShortEs(d.d)}</div>
                                <div style={{ fontSize: 12 }}>{d.d.getDate()}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {rows.map((r, rIdx) => (
                            <tr key={`${wk.key}-${r.key}`} style={{ background: rIdx % 2 === 0 ? '#fff' : '#fbfdff' }}>
                              <td style={S.calTd}>{r.carrera || '-'}</td>
                              <td style={S.calTd}>{r.edificio || '-'}</td>
                              <td style={S.calTd}>{r.salon || '-'}</td>
                              <td style={S.calTd}>{r.hora || '-'}</td>

                              {wk.days.map(d => {
                                const future = isFutureYMD(d.ymd);

                                const cell = r.byDate[d.ymd] ?? { code: '', note: '', item: null };
                                const code = cell.code ?? '';
                                const note = cell.note ?? '';

                                const noteShort = note.length > 24 ? `${note.slice(0, 24)}…` : note;

                                return (
                                  <td
                                    key={d.ymd}
                                    style={{
                                      ...S.calCell,
                                      opacity: future ? 0.45 : 1,
                                      pointerEvents: future ? 'none' : 'auto',
                                    }}
                                    title={future ? 'Día futuro (bloqueado)' : undefined}
                                  >
                                    {code ? (
                                      <>
                                        <button
                                          type="button"
                                          style={{
                                            ...S.codeStyle(code),
                                            cursor: future ? 'not-allowed' : 'pointer',
                                            padding: 0,
                                            outline: 'none',
                                          }}
                                          onClick={() => open(d.ymd, d.d, r, cell)}
                                          title={note ? 'Ver nota completa' : 'Ver detalle'}
                                          disabled={future}
                                        >
                                          {code}
                                        </button>
                                        {note ? <span style={S.noteText}>{noteShort}</span> : null}
                                      </>
                                    ) : (
                                      <span style={{ opacity: 0.25 }}>—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 550, opacity: 0.75 }}>
                      *Tip: da click en el recuadro (P/A/R/…) para ver la nota completa.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================
// Export builders (para profesor seleccionado)
// ===============================
const buildExportRows = (detalle: ReporteAsistenciaItem[]) => {
  const toMin = (v: string) => {
    const mm = (v ?? '').match(/(\d{1,2})(?::(\d{2}))?/);
    if (!mm) return Number.MAX_SAFE_INTEGER;
    const hh = Number(mm[1]);
    const mi = mm[2] ? Number(mm[2]) : 0;
    return hh * 60 + mi;
  };

  const sorted = [...detalle].sort((a, b) => {
    const fa = String((a as any).fecha ?? '');
    const fb = String((b as any).fecha ?? '');
    const c = fa.localeCompare(fb);
    if (c !== 0) return c;
    return toMin(String(a.horaClase ?? '')) - toMin(String(b.horaClase ?? ''));
  });

  return sorted.map(r => {
    const fecha = String((r as any).fecha ?? '');
    const dt = fecha ? parseYMD(fecha) : null;
    const dia = dt ? weekdayLongEs(dt) : '';

    const estadoTexto = String((r as any).estado ?? '');
    const codigo = estadoToCodigo(estadoTexto);
    const nota = String((r as any).notaAdicional ?? '');
    const horaReg = toTime((r as any).horaRegistro ?? null);

    return {
      Fecha: fecha,
      Dia: dia,
      Profesor: String(r.profesor ?? ''),
      Carrera: String(r.carrera ?? ''),
      Edificio: String(r.edificio ?? ''),
      Salon: String(r.salon ?? ''),
      HoraClase: String(r.horaClase ?? ''),
      HoraRegistro: horaReg,
      Estado: estadoTexto,
      Codigo: codigo,
      NotaAdicional: nota,
    };
  });
};

const exportProfesorCSV = (profesor: string, detalle: ReporteAsistenciaItem[], fechaInicio: string, fechaFin: string) => {
  const rows = buildExportRows(detalle);
  const headers = Object.keys(
    rows[0] ?? {
      Fecha: '',
      Dia: '',
      Profesor: '',
      Carrera: '',
      Edificio: '',
      Salon: '',
      HoraClase: '',
      HoraRegistro: '',
      Estado: '',
      Codigo: '',
      NotaAdicional: '',
    },
  );

  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(','));
  for (const r of rows) {
    lines.push(headers.map(h => csvEscape((r as any)[h])).join(','));
  }

  const safeName = profesor.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'profesor';
  const filename =
    fechaInicio === fechaFin ? `reporte_${safeName}_${fechaInicio}.csv` : `reporte_${safeName}_${fechaInicio}_a_${fechaFin}.csv`;

  downloadBlob(filename, 'text/csv;charset=utf-8', lines.join('\n'));
};

const exportProfesorExcel = (profesor: string, detalle: ReporteAsistenciaItem[], fechaInicio: string, fechaFin: string) => {
  const rows = buildExportRows(detalle);
  const headers = Object.keys(
    rows[0] ?? {
      Fecha: '',
      Dia: '',
      Profesor: '',
      Carrera: '',
      Edificio: '',
      Salon: '',
      HoraClase: '',
      HoraRegistro: '',
      Estado: '',
      Codigo: '',
      NotaAdicional: '',
    },
  );

  const escHtml = (v: any) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const table = `
  <table border="1">
    <thead>
      <tr>
        ${headers.map(h => `<th style="background:#eef6ff;color:#0b3fa5;font-weight:700">${escHtml(h)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map(r => `<tr>${headers.map(h => `<td>${escHtml((r as any)[h])}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>`;

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
    </head>
    <body>
      ${table}
    </body>
  </html>`.trim();

  const safeName = profesor.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'profesor';
  const filename =
    fechaInicio === fechaFin ? `reporte_${safeName}_${fechaInicio}.xls` : `reporte_${safeName}_${fechaInicio}_a_${fechaFin}.xls`;

  downloadBlob(filename, 'application/vnd.ms-excel;charset=utf-8', html);
};

// ===============================
// PAGE
// ===============================
export const ReporteAsistenciasPage = () => {
  // ✅ HOOK AQUÍ ADENTRO (CORREGIDO)
  const { user } = useAuth();

  const hoy = toYMD(new Date()); // ✅ hoy en horario local

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);

  const [fProfesor, setFProfesor] = useState('');
  const [fCarrera, setFCarrera] = useState('');
  const [fEdificio, setFEdificio] = useState('');

  const [selectedProfesor, setSelectedProfesor] = useState<string | null>(null);

  const [resSortKey, setResSortKey] = useState<ResumenSortKey>('profesor');
  const [resSortDir, setResSortDir] = useState<ResumenSortDir>('asc');
  const [resPageSize, setResPageSize] = useState<number>(10);
  const [resPage, setResPage] = useState<number>(1);

  const [data, setData] = useState<ReporteAsistenciaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [noteModal, setNoteModal] = useState<NoteModalInfo>(null);

  // responsive (sin CSS externo)
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

  const rangoLabel = useMemo(() => {
    if (!fechaInicio || !fechaFin) return 'Rango: -';
    return fechaInicio === fechaFin ? `Rango: ${fechaInicio}` : `Rango: ${fechaInicio} → ${fechaFin}`;
  }, [fechaInicio, fechaFin]);

  const filtrosLabel = useMemo(() => {
    const parts: string[] = [];
    if (fProfesor) parts.push(`Profesor: ${fProfesor}`);
    if (fCarrera) parts.push(`Carrera: ${fCarrera}`);
    if (fEdificio) parts.push(`Edificio: ${fEdificio}`);
    return parts.length ? parts.join(' · ') : 'Sin filtros';
  }, [fProfesor, fCarrera, fEdificio]);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAsistenciasPorRango(fechaInicio, fechaFin);
      setData(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar el reporte');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  const dataOrdenadaBase = useMemo(() => {
    const horaMin = (v?: string) => {
      const m = (v ?? '').match(/(\d{1,2})(?::(\d{2}))?/);
      if (!m) return Number.MAX_SAFE_INTEGER;
      const hh = Number(m[1]);
      const mm = m[2] ? Number(m[2]) : 0;
      return hh * 60 + mm;
    };

    return [...data].sort((a, b) => {
      const fa = String((a as any).fecha ?? '');
      const fb = String((b as any).fecha ?? '');
      const cmpF = fa.localeCompare(fb);
      if (cmpF !== 0) return cmpF;

      const e = normalizeText(a.edificio).localeCompare(normalizeText(b.edificio));
      if (e !== 0) return e;

      const s = normalizeText(a.salon).localeCompare(normalizeText(b.salon));
      if (s !== 0) return s;

      return horaMin(a.horaClase) - horaMin(b.horaClase);
    });
  }, [data]);

  const dataFiltrada = useMemo(() => {
    const p = normalizeText(fProfesor);
    const c = normalizeText(fCarrera);
    const e = normalizeText(fEdificio);

    return dataOrdenadaBase.filter(r => {
      if (p && normalizeText(r.profesor) !== p) return false;
      if (c && normalizeText(r.carrera) !== c) return false;
      if (e && normalizeText(r.edificio) !== e) return false;
      return true;
    });
  }, [dataOrdenadaBase, fProfesor, fCarrera, fEdificio]);

  useEffect(() => {
    setResPage(1);
    setSelectedProfesor(null);
  }, [fechaInicio, fechaFin, fProfesor, fCarrera, fEdificio, resPageSize]);

  const opcionesProfesores = useMemo(() => {
    const set = new Set<string>();
    for (const r of dataOrdenadaBase) set.add(String(r.profesor ?? '').trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [dataOrdenadaBase]);

  const opcionesCarreras = useMemo(() => {
    const set = new Set<string>();
    for (const r of dataOrdenadaBase) set.add(String(r.carrera ?? '').trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [dataOrdenadaBase]);

  const opcionesEdificios = useMemo(() => {
    const set = new Set<string>();
    for (const r of dataOrdenadaBase) set.add(String(r.edificio ?? '').trim());
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [dataOrdenadaBase]);

  // ===============================
  // RESUMEN POR PROFESOR
  // ===============================
  const resumenPorProfesor = useMemo(() => {
    const codigos = ['P', 'A', 'C', 'I', 'R', 'S', 'JM'];

    const map = new Map<
      string,
      { profesor: string; counts: Record<string, number>; clasesProgramadas: number; clasesAsistidas: number }
    >();

    for (const r of dataFiltrada) {
      const profesor = String(r.profesor ?? 'Sin profesor');
      const codigo = estadoToCodigo((r as any).estado);

      if (!map.has(profesor)) map.set(profesor, { profesor, counts: {}, clasesProgramadas: 0, clasesAsistidas: 0 });

      const row = map.get(profesor)!;
      if (codigo) row.counts[codigo] = (row.counts[codigo] ?? 0) + 1;
      row.clasesProgramadas += 1;
      if (codigo === 'P') row.clasesAsistidas += 1;
    }

    const rows = Array.from(map.values()).map(r => {
      const porcentaje = r.clasesProgramadas > 0 ? (r.clasesAsistidas / r.clasesProgramadas) * 100 : 0;
      return { ...r, porcentaje };
    });

    return { codigos, rows };
  }, [dataFiltrada]);

  const resumenOrdenado = useMemo(() => {
    const dir = resSortDir === 'asc' ? 1 : -1;

    const getCount = (r: (typeof resumenPorProfesor.rows)[number], code: string) => r.counts[code] ?? 0;

    const val = (r: (typeof resumenPorProfesor.rows)[number]): string | number => {
      switch (resSortKey) {
        case 'profesor':
          return normalizeText(r.profesor);
        case 'P':
        case 'A':
        case 'C':
        case 'I':
        case 'R':
        case 'S':
        case 'JM':
          return getCount(r, resSortKey);
        case 'asistenciaPct':
          return r.porcentaje;
        case 'asistenciaFrac':
          return r.clasesAsistidas * 100000 + r.clasesProgramadas;
        default:
          return normalizeText(r.profesor);
      }
    };

    return [...resumenPorProfesor.rows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [resumenPorProfesor.rows, resSortKey, resSortDir]);

  const resumenTotal = resumenOrdenado.length;
  const resumenTotalPages = useMemo(() => Math.max(1, Math.ceil(resumenTotal / resPageSize)), [resumenTotal, resPageSize]);
  const resumenSafePage = Math.min(Math.max(1, resPage), resumenTotalPages);

  const resumenSlice = useMemo(() => {
    const start = (resumenSafePage - 1) * resPageSize;
    return resumenOrdenado.slice(start, start + resPageSize);
  }, [resumenOrdenado, resPageSize, resumenSafePage]);

  const resumenShowingFrom = resumenTotal === 0 ? 0 : (resumenSafePage - 1) * resPageSize + 1;
  const resumenShowingTo = resumenTotal === 0 ? 0 : Math.min(resumenSafePage * resPageSize, resumenTotal);

  const toggleResumenSort = (key: ResumenSortKey) => {
    if (resSortKey === key) return setResSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    setResSortKey(key);
    setResSortDir('asc');
  };

  const resumenSortIndicator = (key: ResumenSortKey) => {
    if (resSortKey !== key) return '';
    return resSortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const thExcelResumen = (key: ResumenSortKey) => ({
    ...S.th,
    ...(resSortKey === key ? S.thActive : null),
    ...S.thSortable,
  });

  // ===============================
  // PROFESOR SELECCIONADO
  // ===============================
  const detalleProfesor = useMemo(() => {
    if (!selectedProfesor) return [];
    const p = normalizeText(selectedProfesor);
    return dataFiltrada.filter(r => normalizeText(r.profesor) === p);
  }, [dataFiltrada, selectedProfesor]);

  // ===============================
  // PDF GENERAL
  // ===============================
  const generarPDF = () => {
    const doc = new jsPDF(); // portrait

    const now = new Date();
    const generadoEl = now.toLocaleString();
    const generadoPor = user ? `${(user as any).name} (${(user as any).rol})` : '—';

    const stats = calcGlobalStats(dataFiltrada);
    const totalProfes = new Set(dataFiltrada.map(x => normalizeText(x.profesor))).size;

    const startY = addPdfHeader(doc, {
      title: 'Reporte de asistencias',
      lines: [rangoLabel, `Filtros: ${filtrosLabel}`, `Generado el: ${generadoEl}`, `Generado por: ${generadoPor}`],
    });

    const kpiHead = [['Total registros', 'Total profesores', 'Asistencia (P/Total)', '% Asistencia']];
    const kpiBody = [[String(stats.total), String(totalProfes), `${stats.asistidas}/${stats.total}`, fmtPct(stats.pct)]];

    autoTable(doc, {
      startY,
      head: kpiHead,
      body: kpiBody,
      styles: { fontSize: 10, cellPadding: 3, halign: 'center' },
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
      didDrawPage: attachFooterForAutoTable(doc, `Reporte general · ${rangoLabel}`),
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 45) + 6,
      head: [['Código', 'Total']],
      body: stats.codigos.map(c => [codeWithLabel(c), String(stats.counts[c] ?? 0)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [238, 246, 255], textColor: [11, 63, 165] },
      margin: { left: 14, right: 14 },
      didDrawPage: attachFooterForAutoTable(doc, `Reporte general · ${rangoLabel}`),
    });

    const codigos = resumenPorProfesor.codigos;

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 60) + 10,
      head: [['Profesor', ...codigos, 'Asistencia (clases) / %']],
      body: resumenOrdenado.map(r => [
        r.profesor,
        ...codigos.map(c => String(r.counts[c] ?? 0)),
        `${r.clasesAsistidas}/${r.clasesProgramadas} (${Math.round(r.porcentaje)}%)`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [238, 246, 255], textColor: [11, 63, 165] },
      alternateRowStyles: { fillColor: [251, 253, 255] },
      margin: { left: 14, right: 14 },
      didDrawPage: attachFooterForAutoTable(doc, `Reporte general · ${rangoLabel}`),
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 60) + 10,
      head: [['Fecha', 'Profesor', 'Carrera', 'Edificio', 'Salón', 'Hora clase', 'Hora registro', 'Estado', 'Nota']],
      body: dataFiltrada.map(r => [
        String((r as any).fecha ?? ''),
        String(r.profesor ?? ''),
        String(r.carrera ?? ''),
        String(r.edificio ?? ''),
        String(r.salon ?? ''),
        String(r.horaClase ?? ''),
        toHHmm((r as any).horaRegistro ?? null), // ✅ aquí se ve HH:mm aunque venga "HH:mm:ss"
        estadoToCodigo((r as any).estado),
        truncate((r as any).notaAdicional ?? '', 60),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [238, 246, 255], textColor: [11, 63, 165], fontSize: 9 },
      alternateRowStyles: { fillColor: [251, 253, 255] },
      margin: { bottom: 18, left: 14, right: 14 },
      didDrawPage: attachFooterForAutoTable(doc, `Reporte general · ${rangoLabel}`),
    });

    finalizePdfPageNumbers(doc);

    const filename =
      fechaInicio === fechaFin ? `reporte-asistencias-${fechaInicio}.pdf` : `reporte-asistencias-${fechaInicio}-a-${fechaFin}.pdf`;

    doc.save(filename);
  };

  // ===============================
  // PDF SOLO PROFESOR
  // ===============================
  const generarPDFProfesor = (profesor: string) => {
    const doc = new jsPDF(); // portrait

    const now = new Date();
    const generadoEl = now.toLocaleString();
    const generadoPor = user ? `${(user as any).name} (${(user as any).rol})` : '—';

    const detalle = detalleProfesor;

    const counts: Record<string, number> = {};
    let clasesProgramadas = 0;
    let clasesAsistidas = 0;

    for (const r of detalle) {
      const codigo = estadoToCodigo((r as any).estado);
      if (codigo) counts[codigo] = (counts[codigo] ?? 0) + 1;
      clasesProgramadas += 1;
      if (codigo === 'P') clasesAsistidas += 1;
    }

    const porcentaje = clasesProgramadas > 0 ? (clasesAsistidas / clasesProgramadas) * 100 : 0;
    const codigos = resumenPorProfesor.codigos;

    const startY = addPdfHeader(doc, {
      title: 'Reporte de asistencias (por profesor)',
      lines: [rangoLabel, `Profesor: ${profesor}`, `Filtros: ${filtrosLabel}`, `Generado el: ${generadoEl}`, `Generado por: ${generadoPor}`],
    });

    autoTable(doc, {
      startY,
      head: [['Clases programadas', 'Asistidas (P)', '% Asistencia']],
      body: [[String(clasesProgramadas), String(clasesAsistidas), fmtPct(porcentaje)]],
      styles: { fontSize: 10, cellPadding: 3, halign: 'center' },
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
      didDrawPage: attachFooterForAutoTable(doc, `Profesor · ${profesor}`),
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 45) + 8,
      head: [['Profesor', ...codigos, 'Asistencia (clases) / %']],
      body: [[profesor, ...codigos.map(c => String(counts[c] ?? 0)), `${clasesAsistidas}/${clasesProgramadas} (${Math.round(porcentaje)}%)`]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [238, 246, 255], textColor: [11, 63, 165] },
      margin: { left: 14, right: 14 },
      didDrawPage: attachFooterForAutoTable(doc, `Profesor · ${profesor}`),
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY ?? 60) + 10,
      head: [['Fecha', 'Carrera', 'Edificio', 'Salón', 'Hora clase', 'Hora registro', 'Estado', 'Nota (preview)']],
      body: detalle.map(r => [
        String((r as any).fecha ?? ''),
        String(r.carrera ?? ''),
        String(r.edificio ?? ''),
        String(r.salon ?? ''),
        String(r.horaClase ?? ''),
        toHHmm((r as any).horaRegistro ?? null), // ✅ HH:mm
        estadoToCodigo((r as any).estado),
        truncate((r as any).notaAdicional ?? '', 60),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [238, 246, 255], textColor: [11, 63, 165], fontSize: 9 },
      alternateRowStyles: { fillColor: [251, 253, 255] },
      margin: { bottom: 18, left: 14, right: 14 },
      didDrawPage: attachFooterForAutoTable(doc, `Profesor · ${profesor}`),
    });

    const notes = collectProfessorNotes(detalle);
    const notesMap = buildNoteIndexMap(notes);

    addProfessorCalendarPdf(doc, { profesor, fechaInicio, fechaFin, detalle, notesMap });

    if (notes.length) {
      doc.addPage('a4', 'portrait');

      const y0 = addPdfHeader(doc, {
        title: 'Notas (texto completo)',
        lines: [
          `Profesor: ${profesor}`,
          `Rango: ${fechaInicio === fechaFin ? fechaInicio : `${fechaInicio} → ${fechaFin}`}`,
          `Total de notas: ${notes.length}`,
        ],
      });

      autoTable(doc, {
        startY: y0,
        head: [['#', 'Fecha', 'Carrera', 'Ubicación', 'Hora clase', 'Hora registro', 'Estado', 'Nota completa']],
        body: notes.map(n => [
          String(n.n),
          n.fecha,
          n.carrera || '-',
          `${n.edificio || '-'} / ${n.salon || '-'}`,
          n.horaClase || '-',
          n.horaRegistro || '-',
          `${n.codigo} (${n.estado})`,
          n.nota,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [238, 246, 255], textColor: [11, 63, 165] },
        alternateRowStyles: { fillColor: [251, 253, 255] },
        margin: { bottom: 18, left: 14, right: 14 },
        didDrawPage: attachFooterForAutoTable(doc, `Notas · ${profesor}`),
      });
    }

    finalizePdfPageNumbers(doc);

    const filename =
      fechaInicio === fechaFin ? `reporte-${safeFileName(profesor)}-${fechaInicio}.pdf` : `reporte-${safeFileName(profesor)}-${fechaInicio}-a-${fechaFin}.pdf`;

    doc.save(filename);
  };

  return (
    <div style={S.screen}>
      {/* MODAL DE NOTA */}
      {noteModal && (
        <div style={S.modalOverlay} onClick={() => setNoteModal(null)} role="button" tabIndex={0} aria-label="Cerrar modal">
          <div style={S.modalCard} onClick={e => e.stopPropagation()}>
            <div style={S.modalHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="note" />
                Nota / Detalle
              </div>
              <button type="button" style={S.btnSoft(false)} onClick={() => setNoteModal(null)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="close" />
                  Cerrar
                </span>
              </button>
            </div>

            <div style={S.modalBody}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <span style={{ ...S.codeStyle(noteModal.codigo || '-'), width: 46, height: 30 }}>{noteModal.codigo || '-'}</span>
                <div style={{ fontWeight: 550, color: '#0f172a' }}>{noteModal.profesor}</div>
                <div style={{ opacity: 0.8, fontWeight: 550 }}>
                  {noteModal.diaLabel} · {noteModal.fechaLabel}
                </div>
              </div>

              <div style={S.modalGrid}>
                <div style={S.modalBox}>
                  <div style={S.modalLabel}>Carrera</div>
                  <div style={S.modalValue}>{noteModal.carrera || '-'}</div>
                </div>

                <div style={S.modalBox}>
                  <div style={S.modalLabel}>Ubicación</div>
                  <div style={S.modalValue}>
                    {noteModal.edificio || '-'} · {noteModal.salon || '-'}
                  </div>
                </div>

                <div style={S.modalBox}>
                  <div style={S.modalLabel}>Hora clase / registro</div>
                  <div style={S.modalValue}>
                    {noteModal.horaClase || '-'} · {noteModal.horaRegistro || '-'}
                  </div>
                </div>

                <div style={S.modalBox}>
                  <div style={S.modalLabel}>Estado (texto)</div>
                  <div style={S.modalValue}>{noteModal.estadoTexto || '-'}</div>
                </div>

                <div style={{ ...S.modalBox, gridColumn: '1 / -1' }}>
                  <div style={S.modalLabel}>Nota adicional</div>
                  <div style={{ ...S.modalValue, whiteSpace: 'pre-wrap', fontWeight: 550 }}>
                    {noteModal.nota?.trim() ? noteModal.nota : 'Sin nota.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={S.page}>
        {/* HERO */}
        <header style={S.hero}>
          <div style={S.heroRow}>
            <div style={S.heroLeft}>
              <div style={S.heroIconCircle}>
                <Icon name="doc" />
              </div>
              <div>
                <h1 style={S.h1}>Reporte de Asistencias</h1>
                <div style={S.sub}>
                  {rangoLabel} · <span style={{ opacity: 0.95 }}>{filtrosLabel}</span>
                </div>
              </div>
            </div>

            <div style={S.heroChip}>
              <Icon name="list" />
              <span style={{ fontWeight: 550 }}>{dataFiltrada.length}</span>
              <span style={{ opacity: 0.9, fontWeight: 550 }}>registros</span>
            </div>
          </div>
        </header>

        {/* FILTROS */}
        <section style={S.card}>
          <div style={{ ...S.cardHead, justifyContent: 'flex-start' }}>
            <Icon name="filter" />
            Filtros de búsqueda
          </div>

          <div style={S.cardBody}>
            <div style={gridStyle}>
              {/* Fecha inicio */}
              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#7c3aed')}>
                    <Icon name="calendar" />
                  </span>
                  Fecha inicio
                </div>
                <input
                  type="date"
                  value={fechaInicio}
                  max={hoy}
                  onChange={e => {
                    const v = clampToTodayYMD(e.target.value);
                    setFechaInicio(v);
                    // si inicio queda después del fin, ajusta fin
                    if (fechaFin && v && v > fechaFin) setFechaFin(v);
                  }}
                  style={S.control}
                />
              </div>

              {/* Fecha fin */}
              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#7c3aed')}>
                    <Icon name="calendar" />
                  </span>
                  Fecha fin
                </div>
                <input
                  type="date"
                  value={fechaFin}
                  max={hoy}
                  onChange={e => {
                    const v = clampToTodayYMD(e.target.value);
                    setFechaFin(v);
                    // si fin queda antes del inicio, ajusta inicio
                    if (fechaInicio && v && v < fechaInicio) setFechaInicio(v);
                  }}
                  style={S.control}
                />
              </div>

              {/* Profesor */}
              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#2563eb')}>
                    <Icon name="user" />
                  </span>
                  Profesor
                </div>
                <select value={fProfesor} onChange={e => setFProfesor(e.target.value)} style={S.control}>
                  <option value="">Todos</option>
                  {opcionesProfesores.map(x => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              {/* Carrera */}
              <div>
                <div style={S.fieldLabelRow}>
                  <span style={S.iconBadge('#8b5cf6')}>
                    <Icon name="book" />
                  </span>
                  Carrera
                </div>
                <select value={fCarrera} onChange={e => setFCarrera(e.target.value)} style={S.control}>
                  <option value="">Todas</option>
                  {opcionesCarreras.map(x => (
                    <option key={x} value={x}>
                      {x}
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
                <select value={fEdificio} onChange={e => setFEdificio(e.target.value)} style={S.control}>
                  <option value="">Todos</option>
                  {opcionesEdificios.map(x => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14, ...S.rowActions }}>
              <button
                type="button"
                onClick={() => {
                  setFProfesor('');
                  setFCarrera('');
                  setFEdificio('');
                }}
                disabled={loading}
                style={S.btnDangerSoft(loading)}
                title="Limpiar filtros"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="trash" />
                  Limpiar filtros
                </span>
              </button>

              <button type="button" onClick={cargar} disabled={loading} style={S.btnSoft(loading)} title="Recargar">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="reload" />
                  {loading ? 'Actualizando…' : 'Actualizar'}
                </span>
              </button>

              <button
                type="button"
                onClick={generarPDF}
                disabled={dataFiltrada.length === 0}
                style={S.btnPrimary(dataFiltrada.length === 0)}
                title="Generar PDF"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="download" />
                  Generar PDF
                </span>
              </button>
            </div>

            {error && <div style={S.alert('error')}>{error}</div>}
          </div>
        </section>

        {/* RESUMEN */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="list" />
              Resumen por profesor
            </div>

            {selectedProfesor ? (
              <button type="button" style={S.btnMini(true)} onClick={() => setSelectedProfesor(null)}>
                Ocultar calendario
              </button>
            ) : null}
          </div>

          <div style={S.cardBody}>
            <div style={S.codeLegend}>
              {[
                ['P', 'Presente'],
                ['A', 'Ausente'],
                ['I', 'Incapacidad'],
                ['C', 'Comisión'],
                ['R', 'Retardo'],
                ['S', 'Suspendido'],
                ['JM', 'Justificante médico'],
              ].map(([c, t]) => (
                <div key={c} style={S.badgeCode}>
                  <span style={{ ...S.dot, width: 8, height: 8, boxShadow: '0 0 0 5px rgba(37,99,235,.10)' }} />
                  <span style={{ minWidth: 26 }}>{c}</span>
                  <span style={S.muted}>— {t}</span>
                </div>
              ))}
            </div>

            <div style={S.pagerRow}>
              <div style={{ fontWeight: 550 }}>
                Total de profesores: <b>{resumenTotal}</b>{' '}
                {resumenTotal > 0 && (
                  <span style={S.muted}>
                    (Mostrando {resumenShowingFrom}–{resumenShowingTo})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <span style={S.muted}>Paginación</span>
                  <select value={resPageSize} onChange={e => setResPageSize(Number(e.target.value))} style={S.control}>
                    {[3, 5, 10, 20].map(n => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={S.pager}>
                  <button type="button" onClick={() => setResPage(1)} disabled={resumenSafePage <= 1} style={S.pagerBtn(resumenSafePage <= 1)}>
                    {'<<'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResPage(p => Math.max(1, p - 1))}
                    disabled={resumenSafePage <= 1}
                    style={S.pagerBtn(resumenSafePage <= 1)}
                  >
                    {'<'}
                  </button>

                  <div style={S.pagerInfo}>
                    Página <b>{resumenSafePage}</b> / {Math.max(1, Math.ceil(resumenTotal / resPageSize))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setResPage(p => Math.min(Math.max(1, Math.ceil(resumenTotal / resPageSize)), p + 1))}
                    disabled={resumenSafePage >= Math.max(1, Math.ceil(resumenTotal / resPageSize))}
                    style={S.pagerBtn(resumenSafePage >= Math.max(1, Math.ceil(resumenTotal / resPageSize)))}
                  >
                    {'>'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResPage(Math.max(1, Math.ceil(resumenTotal / resPageSize)))}
                    disabled={resumenSafePage >= Math.max(1, Math.ceil(resumenTotal / resPageSize))}
                    style={S.pagerBtn(resumenSafePage >= Math.max(1, Math.ceil(resumenTotal / resPageSize)))}
                  >
                    {'>>'}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ marginTop: 12 }}>Cargando...</div>
            ) : resumenTotal === 0 ? (
              <div style={{ marginTop: 12 }}>No hay registros para este rango/filtros.</div>
            ) : (
              <div style={{ marginTop: 12, ...S.tableWrap }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={thExcelResumen('profesor')} onClick={() => toggleResumenSort('profesor')}>
                        Profesor{resumenSortIndicator('profesor')}
                      </th>

                      {resumenPorProfesor.codigos.map(c => (
                        <th key={c} style={thExcelResumen(c as ResumenSortKey)} onClick={() => toggleResumenSort(c as ResumenSortKey)}>
                          {c}
                          {resumenSortIndicator(c as ResumenSortKey)}
                        </th>
                      ))}

                      <th style={thExcelResumen('asistenciaFrac')} onClick={() => toggleResumenSort('asistenciaFrac')}>
                        Asistencia (clases) / %{resumenSortIndicator('asistenciaFrac')}
                      </th>

                      <th style={{ ...S.th, textAlign: 'center' as const }}>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {resumenSlice.map(r => {
                      const isOpen = !!selectedProfesor && normalizeText(selectedProfesor) === normalizeText(r.profesor);

                      return (
                        <tr key={r.profesor} style={{ background: isOpen ? 'rgba(37,99,235,.06)' : '#fff' }}>
                          <td style={S.td}>
                            <b>{r.profesor}</b>
                          </td>

                          {resumenPorProfesor.codigos.map(c => (
                            <td key={c} style={S.td}>
                              {r.counts[c] ?? 0}
                            </td>
                          ))}

                          <td style={S.td}>
                            <b>
                              {r.clasesAsistidas}/{r.clasesProgramadas}
                            </b>{' '}
                            <span style={S.muted}>({Math.round(r.porcentaje)}%)</span>
                          </td>

                          <td style={{ ...S.td, textAlign: 'center' as const }}>
                            <button
                              type="button"
                              style={S.btnMini(isOpen)}
                              onClick={() =>
                                setSelectedProfesor(prev => (normalizeText(prev ?? '') === normalizeText(r.profesor) ? null : r.profesor))
                              }
                              title="Ver calendario por semanas"
                            >
                              {isOpen ? 'Ocultar' : 'Ver'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* CALENDARIO */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="calendar" />
              Calendario del profesor
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }}>
              {selectedProfesor ? (
                <>
                  <button
                    type="button"
                    style={S.btnSoft(false)}
                    onClick={() => generarPDFProfesor(selectedProfesor)}
                    disabled={detalleProfesor.length === 0}
                    title="Exportar PDF solo del profesor"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="download" />
                      Exportar PDF
                    </span>
                  </button>

                  <button
                    type="button"
                    style={S.btnSoft(false)}
                    onClick={() => exportProfesorExcel(selectedProfesor, detalleProfesor, fechaInicio, fechaFin)}
                    disabled={detalleProfesor.length === 0}
                    title="Exportar a Excel"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="file" />
                      Excel
                    </span>
                  </button>

                  <button
                    type="button"
                    style={S.btnSoft(false)}
                    onClick={() => exportProfesorCSV(selectedProfesor, detalleProfesor, fechaInicio, fechaFin)}
                    disabled={detalleProfesor.length === 0}
                    title="Exportar a CSV"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="file" />
                      CSV
                    </span>
                  </button>

                  <button type="button" style={S.btnDangerSoft(false)} onClick={() => setSelectedProfesor(null)}>
                    Cerrar
                  </button>
                </>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 550, opacity: 0.85 }}>Selecciona un profesor en el resumen para ver su calendario.</span>
              )}
            </div>
          </div>

          <div style={S.cardBody}>
            {!selectedProfesor ? (
              <div style={{ padding: 10, color: '#334155', fontWeight: 550 }}>No hay profesor seleccionado.</div>
            ) : detalleProfesor.length === 0 ? (
              <div style={{ padding: 10, color: '#334155', fontWeight: 550 }}>
                No hay registros para <b>{selectedProfesor}</b> con los filtros y rango actuales.
              </div>
            ) : (
              <ProfessorCalendarWeekly
                profesor={selectedProfesor}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                detalle={detalleProfesor}
                onOpenCell={info => setNoteModal(info)}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
