import { useEffect, useMemo, useState } from 'react';
import {
  addSalon,
  createEdificio,
  deleteEdificio,
  deleteSalon,
  getEdificios,
  updateEdificio,
  updateSalon,
  type Edificio,
} from '../api/edificios';

/* ===============================
   Icons (SVG inline)
================================ */
const Icon = ({
  name,
}: {
  name:
    | 'building'
    | 'rooms'
    | 'plus'
    | 'edit'
    | 'trash'
    | 'reload'
    | 'save'
    | 'list';
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
    case 'building':
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
          <path d="M9 9h.01M12 9h.01M15 9h.01" />
          <path d="M9 12h.01M12 12h.01M15 12h.01" />
        </svg>
      );
    case 'rooms':
      return (
        <svg {...common}>
          <path d="M3 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" />
          <path d="M7 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
          <path d="M17 21V11a2 2 0 0 1 2-2h2v12" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
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
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
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
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
    } as const),

  alert: (type: 'ok' | 'error') =>
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
    minWidth: 1100,
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

  muted: { fontSize: 12, opacity: 0.75, fontWeight: 550 } as const,

  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 550,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
  } as const,

  chipBtn: (danger?: boolean, disabled?: boolean) =>
    ({
      padding: '8px 10px',
      borderRadius: 12,
      border: danger ? '1px solid rgba(239,68,68,.30)' : '1px solid rgba(2,6,23,.10)',
      background: danger ? 'rgba(239,68,68,.08)' : 'rgba(255,255,255,.92)',
      color: danger ? '#b91c1c' : '#0b3fa5',
      fontWeight: 550,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      userSelect: 'none' as const,
    } as const),

  inlineGroup: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' } as const,

  // Mobile cards
  mobileCard: {
    border: '1px solid rgba(2,6,23,.10)',
    borderRadius: 16,
    padding: 14,
    background: 'rgba(255,255,255,.96)',
    boxShadow: '0 12px 26px rgba(2,6,23,.08)',
    display: 'grid',
    gap: 12,
  } as const,
};

// ===============================
// Sort natural (ej: 2 < 10, 101 < 1000)
// ===============================
const collatorEsNumeric = new Intl.Collator('es', {
  numeric: true,
  sensitivity: 'base',
});

const sortByNombreNatural = <T extends { nombre: string }>(arr: T[]) =>
  [...arr].sort((a, b) => collatorEsNumeric.compare(String(a.nombre ?? ''), String(b.nombre ?? '')));

// ===============================

export const EdificiosPage = () => {
  const [items, setItems] = useState<Edificio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // create edificio
  const [nombreEdificio, setNombreEdificio] = useState('');

  // salon (por edificio)
  const [salonNombre, setSalonNombre] = useState<Record<number, string>>({});

  // ✅ edición inline edificio
  const [editEdId, setEditEdId] = useState<number | null>(null);
  const [editEdNombre, setEditEdNombre] = useState<string>('');

  // ✅ edición inline salón
  const [editSalonId, setEditSalonId] = useState<number | null>(null);
  const [editSalonNombre, setEditSalonNombre] = useState<string>('');

  // responsive
  const [w, setW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const isSm = w < 820;

  const canCreate = useMemo(() => nombreEdificio.trim().length >= 1, [nombreEdificio]);

  /* ================== DATA ================== */
  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setOk('');
      const data = await getEdificios();
      const normalized = Array.isArray(data) ? data : [];

      setItems(
        sortByNombreNatural(
          normalized.map(e => ({
            ...e,
            salones: sortByNombreNatural(e.salones ?? []),
          })),
        ),
      );

    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los edificios.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    setError('');
    setOk('');

    if (!canCreate) {
      setError('Escribe el nombre del edificio.');
      return;
    }

    try {
      setSaving(true);
      const nuevo = await createEdificio({ nombre: nombreEdificio.trim() });
      setItems(prev => sortByNombreNatural([nuevo, ...prev]));
      setNombreEdificio('');
      setOk('✅ Edificio creado con éxito');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? 'Error al crear edificio';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  // ====== Edición inline edificio ======
  const startEditEdificio = (id: number, current: string) => {
    setEditEdId(id);
    setEditEdNombre(current ?? '');
    setError('');
    setOk('');
  };

  const cancelEditEdificio = () => {
    setEditEdId(null);
    setEditEdNombre('');
  };

  const saveEditEdificio = async () => {
    if (editEdId == null) return;
    const nuevoNombre = editEdNombre.trim();
    if (!nuevoNombre) return;

    try {
      setSaving(true);
      setError('');
      setOk('');
      const updated = await updateEdificio(editEdId, { nombre: nuevoNombre });

      setItems(prev =>
        sortByNombreNatural(
          prev.map(x => (x.id === editEdId ? { ...x, nombre: updated.nombre } : x)),
        ),
      );


      setOk('✅ Edificio actualizado con éxito');
      cancelEditEdificio();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? 'Error al actualizar edificio';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEdificio = async (id: number) => {
    if (!confirm('¿Eliminar edificio? Esto eliminará también sus salones.')) return;

    try {
      setSaving(true);
      setError('');
      setOk('');
      await deleteEdificio(id);
      setItems(prev => prev.filter(x => x.id !== id));
      setOk('✅ Edificio eliminado con éxito');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? 'Error al eliminar edificio';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const onAddSalon = async (edificioId: number) => {
    const nombre = (salonNombre[edificioId] ?? '').trim();
    if (!nombre) {
      setError('Escribe el nombre del salón antes de agregarlo.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setOk('');

      const nuevo = await addSalon(edificioId, { nombre });

      setItems(prev =>
        prev.map(e =>
          e.id === edificioId
          ? { ...e, salones: sortByNombreNatural([...(e.salones ?? []), nuevo]) }
            : e,
        ),
      );

      setSalonNombre(prev => ({ ...prev, [edificioId]: '' }));
      setOk('✅ Salón agregado con éxito');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? 'Error al agregar salón';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  // ====== Edición inline salón ======
  const startEditSalon = (salonId: number, current: string) => {
    setEditSalonId(salonId);
    setEditSalonNombre(current ?? '');
    setError('');
    setOk('');
  };

  const cancelEditSalon = () => {
    setEditSalonId(null);
    setEditSalonNombre('');
  };

  const saveEditSalon = async () => {
    if (editSalonId == null) return;
    const nuevoNombre = editSalonNombre.trim();
    if (!nuevoNombre) return;

    try {
      setSaving(true);
      setError('');
      setOk('');
      const updated = await updateSalon(editSalonId, { nombre: nuevoNombre });

      setItems(prev =>
        prev.map(e => ({
          ...e,
          salones: sortByNombreNatural(
            (e.salones ?? []).map(s => (s.id === editSalonId ? { ...s, nombre: updated.nombre } : s)),
          ),
        })),
      );

      setOk('✅ Salón actualizado con éxito');
      cancelEditSalon();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? 'Error al actualizar salón';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteSalon = async (salonId: number) => {
    if (!confirm('¿Eliminar salón?')) return;

    try {
      setSaving(true);
      setError('');
      setOk('');
      await deleteSalon(salonId);

      setItems(prev =>
        prev.map(e => ({
          ...e,
          salones: (e.salones ?? []).filter(s => s.id !== salonId),
        })),
      );

      setOk('✅ Salón eliminado con éxito');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? 'Error al eliminar salón';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={S.screen}>
        <div style={S.page}>
          <div style={{ padding: 24, fontWeight: 550 }}>Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={S.page}>
        {/* HERO */}
        <header style={S.hero}>
          <div style={S.heroRow}>
            <div style={S.heroLeft}>
              <div style={S.heroIconCircle}>
                <Icon name="building" />
              </div>
              <div>
                <h1 style={S.h1}>Edificios y salones</h1>
                <div style={S.sub}>Administra los edificios y sus salones.</div>
              </div>
            </div>

            <div style={S.heroChip}>
              <Icon name="list" />
              <span style={{ fontWeight: 550 }}>{items.length}</span>
              <span style={{ opacity: 0.9, fontWeight: 550 }}>edificios</span>
            </div>
          </div>
        </header>

        {/* CREAR */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <Icon name="plus" />
            Crear edificio
          </div>

          <div style={S.cardBody}>
            <div style={S.labelRow}>
              <span style={S.iconBadge('#2563eb')}>
                <Icon name="building" />
              </span>
              Nombre del edificio
            </div>

            <input
              style={S.control}
              value={nombreEdificio}
              onChange={e => setNombreEdificio(e.target.value)}
              placeholder="Ej: A, B, D, Laboratorios..."
            />

            <div style={S.rowActions}>
              <button style={S.btnSoft(saving)} onClick={load} disabled={saving} type="button">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="reload" />
                  Recargar
                </span>
              </button>

              <button style={S.btnPrimary(saving || !canCreate)} onClick={onCreate} disabled={saving || !canCreate} type="button">
                <Icon name="save" />
                {saving ? 'Guardando…' : 'Crear'}
              </button>
            </div>

            {error && <div style={S.alert('error')}>{error}</div>}
            {ok && <div style={S.alert('ok')}>{ok}</div>}
          </div>
        </section>

        {/* LISTA */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <Icon name="list" />
            Listado
          </div>

          <div style={S.cardBody}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={S.muted}>Puedes editar nombres y administrar salones por edificio.</div>
              </div>
            </div>

            {items.length === 0 ? (
              <div style={S.muted}>No hay edificios registrados.</div>
            ) : isSm ? (
              // ====== Mobile cards ======
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map(e => (
                  <div key={e.id} style={S.mobileCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        {editEdId === e.id ? (
                          <input
                            style={S.control}
                            value={editEdNombre}
                            onChange={ev => setEditEdNombre(ev.target.value)}
                            placeholder="Nombre edificio"
                          />
                        ) : (
                          <div style={{ fontWeight: 550, fontSize: 16 }}>{e.nombre}</div>
                        )}
                        <div style={S.muted}>ID: {e.id}</div>
                      </div>

                      <div style={S.inlineGroup}>
                        {editEdId === e.id ? (
                          <>
                            <button style={S.btnPrimary(saving || !editEdNombre.trim())} disabled={saving || !editEdNombre.trim()} onClick={saveEditEdificio} type="button">
                              <Icon name="save" />
                              Guardar
                            </button>
                            <button style={S.btnSoft(saving)} disabled={saving} onClick={cancelEditEdificio} type="button">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button style={S.btnSoft(saving)} disabled={saving} onClick={() => startEditEdificio(e.id, e.nombre)} type="button">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Icon name="edit" />
                                Editar
                              </span>
                            </button>
                            <button style={S.btnDangerSoft(saving)} disabled={saving} onClick={() => onDeleteEdificio(e.id)} type="button">
                              <Icon name="trash" />
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ ...S.labelRow, marginBottom: 8 }}>
                        <span style={S.iconBadge('#06b6d4')}>
                          <Icon name="rooms" />
                        </span>
                        Salones
                      </div>

                      {(e.salones ?? []).length === 0 ? (
                        <div style={S.muted}>Sin salones</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 10 }}>
                          {(e.salones ?? []).map(s => {
                            const editingSalon = editSalonId === s.id;
                            return (
                              <div
                                key={s.id}
                                style={{
                                  border: '1px solid rgba(2,6,23,.10)',
                                  borderRadius: 14,
                                  padding: 10,
                                  background: 'rgba(255,255,255,.92)',
                                  display: 'flex',
                                  gap: 10,
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                }}
                              >
                                {editingSalon ? (
                                  <input style={S.control} value={editSalonNombre} onChange={ev => setEditSalonNombre(ev.target.value)} />
                                ) : (
                                  <div style={{ fontWeight: 550 }}>{s.nombre}</div>
                                )}

                                <div style={S.inlineGroup}>
                                  {editingSalon ? (
                                    <>
                                      <button style={S.btnPrimary(saving || !editSalonNombre.trim())} disabled={saving || !editSalonNombre.trim()} onClick={saveEditSalon} type="button">
                                        <Icon name="save" />
                                        Guardar
                                      </button>
                                      <button style={S.btnSoft(saving)} disabled={saving} onClick={cancelEditSalon} type="button">
                                        Cancelar
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button style={S.btnSoft(saving)} disabled={saving} onClick={() => startEditSalon(s.id, s.nombre)} type="button">
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                          <Icon name="edit" />
                                          Editar
                                        </span>
                                      </button>
                                      <button style={S.btnDangerSoft(saving)} disabled={saving} onClick={() => onDeleteSalon(s.id)} type="button">
                                        <Icon name="trash" />
                                        Eliminar
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                        <input
                          style={S.control}
                          value={salonNombre[e.id] ?? ''}
                          onChange={ev => setSalonNombre(prev => ({ ...prev, [e.id]: ev.target.value }))}
                          placeholder="Nuevo salón (ej: 101)"
                        />
                        <button style={S.btnPrimary(saving)} onClick={() => onAddSalon(e.id)} disabled={saving} type="button">
                          <Icon name="plus" />
                          Agregar salón
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // ====== Desktop table ======
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Edificio</th>
                      <th style={S.th}>Salones</th>
                      <th style={{ ...S.th, textAlign: 'center' as const, width: 320 }}>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map(e => {
                      const editingEd = editEdId === e.id;

                      return (
                        <tr key={e.id}>
                          <td style={S.td}>
                            {editingEd ? (
                              <div style={{ display: 'grid', gap: 8, maxWidth: 380 }}>
                                <input
                                  style={S.control}
                                  value={editEdNombre}
                                  onChange={ev => setEditEdNombre(ev.target.value)}
                                  placeholder="Nombre edificio"
                                />
                                <div style={S.muted}>ID: {e.id}</div>
                              </div>
                            ) : (
                              <>
                                <div style={{ fontWeight: 550 }}>{e.nombre}</div>
                                <div style={S.muted}>ID: {e.id}</div>
                              </>
                            )}
                          </td>

                          <td style={S.td}>
                            <div style={{ display: 'grid', gap: 12 }}>
                              {/* Chips de salones */}
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {(e.salones ?? []).length === 0 ? (
                                  <span style={S.muted}>Sin salones</span>
                                ) : (
                                  (e.salones ?? []).map(s => {
                                    const editingSalon = editSalonId === s.id;

                                    return (
                                      <span key={s.id} style={S.chip}>
                                        {editingSalon ? (
                                          <input
                                            style={{ ...S.control, padding: '10px 12px', width: 220 }}
                                            value={editSalonNombre}
                                            onChange={ev => setEditSalonNombre(ev.target.value)}
                                          />
                                        ) : (
                                          <span style={{ fontWeight: 550 }}>{s.nombre}</span>
                                        )}

                                        <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                                          {editingSalon ? (
                                            <>
                                              <button
                                                style={S.chipBtn(false, saving || !editSalonNombre.trim())}
                                                disabled={saving || !editSalonNombre.trim()}
                                                onClick={saveEditSalon}
                                                type="button"
                                              >
                                                Guardar
                                              </button>
                                              <button
                                                style={S.chipBtn(false, saving)}
                                                disabled={saving}
                                                onClick={cancelEditSalon}
                                                type="button"
                                              >
                                                Cancelar
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                style={S.chipBtn(false, saving)}
                                                disabled={saving}
                                                onClick={() => startEditSalon(s.id, s.nombre)}
                                                type="button"
                                              >
                                                Editar
                                              </button>
                                              <button
                                                style={S.chipBtn(true, saving)}
                                                disabled={saving}
                                                onClick={() => onDeleteSalon(s.id)}
                                                type="button"
                                              >
                                                Eliminar
                                              </button>
                                            </>
                                          )}
                                        </span>
                                      </span>
                                    );
                                  })
                                )}
                              </div>

                              {/* Agregar salón */}
                              <div style={S.inlineGroup}>
                                <input
                                  style={{ ...S.control, width: 260 }}
                                  value={salonNombre[e.id] ?? ''}
                                  onChange={ev => setSalonNombre(prev => ({ ...prev, [e.id]: ev.target.value }))}
                                  placeholder="Nuevo salón (ej: 101)"
                                />
                                <button style={S.btnPrimary(saving)} onClick={() => onAddSalon(e.id)} disabled={saving} type="button">
                                  <Icon name="plus" />
                                  Agregar salón
                                </button>
                              </div>
                            </div>
                          </td>

                          <td style={{ ...S.td, textAlign: 'center' as const, width: 320 }}>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {editingEd ? (
                                <>
                                  <button
                                    style={S.btnPrimary(saving || !editEdNombre.trim())}
                                    disabled={saving || !editEdNombre.trim()}
                                    onClick={saveEditEdificio}
                                    type="button"
                                  >
                                    <Icon name="save" />
                                    Guardar
                                  </button>
                                  <button style={S.btnSoft(saving)} disabled={saving} onClick={cancelEditEdificio} type="button">
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button style={S.btnSoft(saving)} disabled={saving} onClick={() => startEditEdificio(e.id, e.nombre)} type="button">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                      <Icon name="edit" />
                                      Editar
                                    </span>
                                  </button>
                                  <button style={S.btnDangerSoft(saving)} disabled={saving} onClick={() => onDeleteEdificio(e.id)} type="button">
                                    <Icon name="trash" />
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {error && <div style={S.alert('error')}>{error}</div>}
            {ok && <div style={S.alert('ok')}>{ok}</div>}
          </div>
        </section>
      </div>
    </div>
  );
};
