import { useEffect, useMemo, useState } from 'react';
import {
  createCarrera,
  deleteCarrera,
  getCarreras,
  updateCarrera,
  type Carrera,
} from '../api/carreras';

/* Icons (SVG inline) */
const Icon = ({
  name,
}: {
  name: 'cap' | 'plus' | 'edit' | 'trash' | 'reload' | 'save' | 'list';
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
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
          <path d="M22 10v6" />
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

/* Styles (match Edificios UI) */
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
    maxWidth: 1200,
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
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
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
    minWidth: 720,
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

  mobileCard: {
    border: '1px solid rgba(2,6,23,.10)',
    borderRadius: 16,
    padding: 14,
    background: 'rgba(255,255,255,.96)',
    boxShadow: '0 12px 26px rgba(2,6,23,.08)',
    display: 'grid',
    gap: 12,
  } as const,

  inlineGroup: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' } as const,
};

export const CarrerasPage = () => {
  const [nombre, setNombre] = useState('');
  const [data, setData] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');

  // edición inline
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');

  // responsive (cards en móvil)
  const [w, setW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const isSm = w < 780;

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      setOk('');
      const res = await getCarreras();
      setData(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al cargar carreras');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const carrerasOrdenadas = useMemo(() => {
    return [...data].sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? '')));
  }, [data]);

  const guardar = async () => {
    try {
      setLoading(true);
      setError('');
      setOk('');

      const clean = nombre.trim();
      if (!clean) return;

      await createCarrera({ nombre: clean });
      setNombre('');
      setOk('✅ Carrera guardada correctamente');
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al guardar carrera');
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = (c: Carrera) => {
    setEditId(c.idCarrera);
    setEditNombre(c.nombre ?? '');
    setOk('');
    setError('');
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditNombre('');
  };

  const guardarEdicion = async () => {
    if (editId == null) return;

    try {
      setLoading(true);
      setError('');
      setOk('');

      const clean = editNombre.trim();
      if (!clean) {
        setError('El nombre no puede ir vacío');
        return;
      }

      await updateCarrera(editId, { nombre: clean });
      setOk('✅ Carrera actualizada correctamente');
      cancelarEdicion();
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al actualizar carrera');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id: number) => {
    try {
      if (!confirm('¿Eliminar carrera?')) return;

      setLoading(true);
      setError('');
      setOk('');

      await deleteCarrera(id);
      setOk('✅ Carrera eliminada correctamente');
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al eliminar carrera');
    } finally {
      setLoading(false);
    }
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
                <h1 style={S.h1}>Carreras</h1>
                <div style={S.sub}>Administra las carreras.</div>
              </div>
            </div>

            <div style={S.heroChip}>
              <Icon name="list" />
              <span style={{ fontWeight: 550 }}>{carrerasOrdenadas.length}</span>
              <span style={{ opacity: 0.9, fontWeight: 550 }}>carreras</span>
            </div>
          </div>
        </header>

        {/* CREAR */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <Icon name="plus" />
            Crear carrera
          </div>

          <div style={S.cardBody}>
            <div style={S.labelRow}>
              <span style={S.iconBadge('#2563eb')}>
                <Icon name="cap" />
              </span>
              Nombre de la carrera
            </div>

            <input
              style={S.control}
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Ingeniería en Sistemas Computacionales"
            />

            <div style={S.rowActions}>
              <button style={S.btnSoft(loading)} onClick={cargar} disabled={loading} type="button">
                <Icon name="reload" />
                Recargar
              </button>

              <button
                style={S.btnPrimary(loading || !nombre.trim())}
                disabled={loading || !nombre.trim()}
                onClick={guardar}
                type="button"
              >
                <Icon name="save" />
                Guardar
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
            </div>

            {isSm ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {loading ? (
                  <div style={S.mobileCard}>Cargando…</div>
                ) : carrerasOrdenadas.length === 0 ? (
                  <div style={S.mobileCard}>No hay carreras</div>
                ) : (
                  carrerasOrdenadas.map(c => {
                    const editing = editId === c.idCarrera;

                    return (
                      <div key={c.idCarrera} style={S.mobileCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ minWidth: 240, flex: 1 }}>
                            {editing ? (
                              <input
                                style={S.control}
                                value={editNombre}
                                onChange={e => setEditNombre(e.target.value)}
                                placeholder="Nombre"
                              />
                            ) : (
                              <div style={{ fontWeight: 550, fontSize: 16 }}>{c.nombre}</div>
                            )}
                            <div style={S.muted}>ID: {c.idCarrera}</div>
                          </div>

                          <div style={S.inlineGroup}>
                            {editing ? (
                              <>
                                <button
                                  style={S.btnPrimary(loading || !editNombre.trim())}
                                  disabled={loading || !editNombre.trim()}
                                  onClick={guardarEdicion}
                                  type="button"
                                >
                                  <Icon name="save" />
                                  Guardar
                                </button>

                                <button style={S.btnSoft(loading)} disabled={loading} onClick={cancelarEdicion} type="button">
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button style={S.btnSoft(loading)} disabled={loading} onClick={() => iniciarEdicion(c)} type="button">
                                  <Icon name="edit" />
                                  Editar
                                </button>

                                <button
                                  style={S.btnDangerSoft(loading)}
                                  disabled={loading}
                                  onClick={() => eliminar(c.idCarrera)}
                                  type="button"
                                >
                                  <Icon name="trash" />
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Nombre</th>
                      <th style={{ ...S.th, width: 320 }}>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td style={S.td} colSpan={2}>
                          Cargando…
                        </td>
                      </tr>
                    ) : carrerasOrdenadas.length === 0 ? (
                      <tr>
                        <td style={S.td} colSpan={2}>
                          No hay carreras
                        </td>
                      </tr>
                    ) : (
                      carrerasOrdenadas.map(c => {
                        const editing = editId === c.idCarrera;

                        return (
                          <tr key={c.idCarrera}>
                            <td style={S.td}>
                              {editing ? (
                                <input
                                  style={S.control}
                                  value={editNombre}
                                  onChange={e => setEditNombre(e.target.value)}
                                  placeholder="Nombre"
                                />
                              ) : (
                                c.nombre
                              )}
                            </td>

                            <td style={S.td}>
                              {editing ? (
                                <div style={S.inlineGroup}>
                                  <button
                                    style={S.btnPrimary(loading || !editNombre.trim())}
                                    disabled={loading || !editNombre.trim()}
                                    onClick={guardarEdicion}
                                    type="button"
                                  >
                                    <Icon name="save" />
                                    Guardar
                                  </button>

                                  <button style={S.btnSoft(loading)} disabled={loading} onClick={cancelarEdicion} type="button">
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <div style={S.inlineGroup}>
                                  <button style={S.btnSoft(loading)} disabled={loading} onClick={() => iniciarEdicion(c)} type="button">
                                    <Icon name="edit" />
                                    Editar
                                  </button>

                                  <button
                                    style={S.btnDangerSoft(loading)}
                                    disabled={loading}
                                    onClick={() => eliminar(c.idCarrera)}
                                    type="button"
                                  >
                                    <Icon name="trash" />
                                    Eliminar
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
            )}

            {error && <div style={S.alert('error')}>{error}</div>}
            {ok && <div style={S.alert('ok')}>{ok}</div>}
          </div>
        </section>
      </div>
    </div>
  );
};
