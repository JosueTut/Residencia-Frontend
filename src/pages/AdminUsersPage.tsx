// src/pages/AdminUsersPage.tsx
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createUser, deleteUser, getUsers, updateUser, type UserRow } from '../api/users';

const ROLES = [
  'SUB_ACADEMICA',
  'SUB_ADMINISTRATIVA',
  'PREFECTO',
  'RRHH',
  'DIRECTOR',
  'JEFE_CARRERA', 
  'ROOT',
] as const;

// ✅ para mostrar bonito en UI (sin afectar el value real)
const roleLabel = (r: string) => String(r ?? '').replace(/_/g, ' ');

/* ===============================
   Icons (SVG inline)
================================ */
const Icon = ({
  name,
}: {
  name:
    | 'users'
    | 'plus'
    | 'edit'
    | 'trash'
    | 'reload'
    | 'save'
    | 'shield'
    | 'mail'
    | 'key';
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
    case 'users':
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...common}>
          <path d="M4 4h16v16H4z" />
          <path d="m22 6-10 7L2 6" />
        </svg>
      );
    case 'key':
      return (
        <svg {...common}>
          <path d="M21 2l-2 2m-7 7a5 5 0 1 1 7.07 0L14 16H9v-5l3-3Z" />
          <path d="M16 6l2 2" />
        </svg>
      );
    default:
      return null;
  }
};

/* ===============================
   Styles (match Carreras/Edificios)
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
  sub: { margin: '6px 0 0', opacity: 0.92, fontWeight: 550, maxWidth: 860 } as const,

  heroChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,.18)',
    border: '1px solid rgba(255,255,255,.22)',
    fontWeight: 550,
    minWidth: 240,
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

  headLeft: { display: 'inline-flex', alignItems: 'center', gap: 10 } as const,

  cardBody: { padding: 16 } as const,

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    marginTop: 12,
    alignItems: 'end',
  } as const,

  label: { display: 'grid', gap: 6, fontSize: 14, fontWeight: 550, color: '#0b3fa5' } as const,

  control: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #dbe3f1',
    outline: 'none',
    fontWeight: 550,
    background: '#fff',
    color: '#0f172a',
  } as const,

  topActions: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' } as const,

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
    minWidth: 900,
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
    userSelect: 'none' as const,
  } as const,

  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle' as const,
    fontWeight: 550,
  } as const,

  roleChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 550,
    color: '#0b3fa5',
    background: '#eef2ff',
    border: '1px solid #dbe3f1',
  } as const,

  muted: { fontSize: 12, opacity: 0.75, fontWeight: 550 } as const,

  inlineActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  } as const,

  mobileCard: {
    border: '1px solid rgba(2,6,23,.10)',
    borderRadius: 16,
    padding: 14,
    background: 'rgba(255,255,255,.96)',
    boxShadow: '0 12px 26px rgba(2,6,23,.08)',
    display: 'grid',
    gap: 12,
  } as const,

  twoCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as const,
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // Form create
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<(typeof ROLES)[number]>('PREFECTO');

  // edición inline
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState<(typeof ROLES)[number]>('PREFECTO');

  // responsive simple (cards en móvil)
  const [w, setW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const isSm = w < 860;

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().includes('@') && password.trim().length >= 6 && Boolean(rol);
  }, [name, email, password, rol]);

  const canSaveEdit = useMemo(() => {
    return editId != null && editName.trim().length >= 2 && editEmail.trim().includes('@') && Boolean(editRol);
  }, [editId, editName, editEmail, editRol]);

  // =========================
  // Data
  // =========================
  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setOk('');
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los usuarios (¿permisos / token?).');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');

    if (!canSubmit) {
      setError('Completa nombre, correo válido, contraseña (mín 6) y rol.');
      return;
    }

    try {
      setSaving(true);

      const nuevo = await createUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        rol, // ✅ ahora siempre manda JEFE_CARRERA (no con espacios)
      });

      setUsers(prev => [nuevo, ...prev]);

      setName('');
      setEmail('');
      setPassword('');
      setRol('PREFECTO');

      setOk('✅ Usuario creado correctamente');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? 'Error al crear usuario';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const iniciarEdicion = (u: UserRow) => {
    setEditId(u.id);
    setEditName(u.name ?? '');
    setEditEmail(u.email ?? '');
    setEditRol(u.rol as any); // aquí debe venir JEFE_CARRERA ya normalizado
    setError('');
    setOk('');
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditName('');
    setEditEmail('');
    setEditRol('PREFECTO');
  };

  const guardarEdicion = async () => {
    if (editId == null) return;

    if (!canSaveEdit) {
      setError('Completa nombre (mín 2), correo válido y rol.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setOk('');

      const updated = await updateUser(editId, {
        name: editName.trim(),
        email: editEmail.trim(),
        rol: editRol,
      });

      setUsers(prev => prev.map(u => (u.id === editId ? { ...u, ...updated } : u)));

      setOk('✅ Usuario actualizado');
      cancelarEdicion();
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? 'Error al actualizar usuario';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) return;

    try {
      setError('');
      setOk('');
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setOk('✅ Usuario eliminado');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? 'Error al eliminar usuario';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Cargando...</p>;

  return (
    <div style={S.screen}>
      <div style={S.page}>
        {/* HERO */}
        <header style={S.hero}>
          <div style={S.heroRow}>
            <div style={S.heroLeft}>
              <div style={S.heroIconCircle}>
                <Icon name="shield" />
              </div>
              <div>
                <h1 style={S.h1}>Administración de usuarios</h1>
                <div style={S.sub}>Administra los usuarios de esta plataforma.</div>
              </div>
            </div>

            <div style={S.heroChip}>
              <Icon name="users" />
              <span style={{ fontWeight: 550 }}>{users.length}</span>
              <span style={{ opacity: 0.9, fontWeight: 550 }}>usuarios</span>
            </div>
          </div>
        </header>

        {/* CREAR */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div style={S.headLeft}>
              <Icon name="plus" />
              Crear usuario
            </div>

            <div style={S.topActions}>
              <button type="button" onClick={load} disabled={saving} style={S.btnSoft(saving)}>
                <Icon name="reload" />
                Recargar
              </button>

              <button
                type="submit"
                form="admin-users-form"
                disabled={saving || !canSubmit}
                style={S.btnPrimary(saving || !canSubmit)}
              >
                <Icon name="save" />
                {saving ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>

          <div style={S.cardBody}>
            <form id="admin-users-form" onSubmit={handleCreate}>
              <div style={S.grid}>
                <label style={S.label}>
                  Nombre
                  <div style={{ position: 'relative' }}>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      style={S.control}
                    />
                  </div>
                </label>

                <label style={S.label}>
                  Correo
                  <div style={{ position: 'relative' }}>
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ejemplo@dominio.com"
                      style={S.control}
                    />
                  </div>
                </label>

                <label style={S.label}>
                  Contraseña
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={S.control}
                    autoComplete="new-password"
                  />
                </label>

                <label style={S.label}>
                  Rol
                  <select value={rol} onChange={e => setRol(e.target.value as any)} style={S.control}>
                    {ROLES.map(r => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {error && <div style={S.alert('error')}>{error}</div>}
              {ok && <div style={S.alert('ok')}>{ok}</div>}
            </form>
          </div>
        </section>

        {/* LISTA */}
        <section style={S.card}>
          <div style={S.cardHead}>
            <div style={S.headLeft}>
              <Icon name="users" />
              Usuarios
            </div>
          </div>

          <div style={S.cardBody}>
            {users.length === 0 ? (
              <div style={{ padding: 4, color: '#64748b', fontWeight: 550 }}>No hay usuarios registrados.</div>
            ) : isSm ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {users.map(u => {
                  const editing = editId === u.id;

                  return (
                    <div key={u.id} style={S.mobileCard}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ fontWeight: 550, fontSize: 16 }}>
                          ID: {u.id}{' '}
                          <span style={{ marginLeft: 8, ...S.roleChip }}>{roleLabel(u.rol)}</span>
                        </div>

                        <div style={S.inlineActions}>
                          {editing ? (
                            <>
                              <button
                                onClick={guardarEdicion}
                                disabled={saving || !canSaveEdit}
                                style={S.btnPrimary(saving || !canSaveEdit)}
                                type="button"
                              >
                                <Icon name="save" />
                                Guardar
                              </button>

                              <button onClick={cancelarEdicion} disabled={saving} style={S.btnSoft(saving)} type="button">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => iniciarEdicion(u)} disabled={saving} style={S.btnSoft(saving)} type="button">
                                <Icon name="edit" />
                                Editar
                              </button>

                              <button onClick={() => handleDelete(u.id)} disabled={saving} style={S.btnDangerSoft(saving)} type="button">
                                <Icon name="trash" />
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editing ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={S.twoCols}>
                            <label style={S.label}>
                              Nombre
                              <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                style={S.control}
                                placeholder="Nombre"
                              />
                            </label>

                            <label style={S.label}>
                              Rol
                              <select value={editRol} onChange={e => setEditRol(e.target.value as any)} style={S.control}>
                                {ROLES.map(r => (
                                  <option key={r} value={r}>
                                    {roleLabel(r)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <label style={S.label}>
                            Correo
                            <input value={editEmail} onChange={e => setEditEmail(e.target.value)} style={S.control} placeholder="Correo" />
                          </label>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: 6 }}>
                          <div style={{ fontWeight: 550 }}>{u.name}</div>
                          <div style={S.muted}>{u.email}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>Nombre</th>
                      <th style={S.th}>Correo</th>
                      <th style={S.th}>Rol</th>
                      <th style={{ ...S.th, textAlign: 'center' as const }}>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map(u => {
                      const editing = editId === u.id;

                      return (
                        <tr key={u.id}>
                          <td style={S.td}>{u.id}</td>

                          <td style={S.td}>
                            {editing ? (
                              <input value={editName} onChange={e => setEditName(e.target.value)} style={S.control} placeholder="Nombre" />
                            ) : (
                              <div style={{ fontWeight: 550 }}>{u.name}</div>
                            )}
                          </td>

                          <td style={S.td}>
                            {editing ? (
                              <input value={editEmail} onChange={e => setEditEmail(e.target.value)} style={S.control} placeholder="Correo" />
                            ) : (
                              u.email
                            )}
                          </td>

                          <td style={S.td}>
                            {editing ? (
                              <select value={editRol} onChange={e => setEditRol(e.target.value as any)} style={S.control}>
                                {ROLES.map(r => (
                                  <option key={r} value={r}>
                                    {roleLabel(r)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span style={S.roleChip}>{roleLabel(u.rol)}</span>
                            )}
                          </td>

                          <td style={{ ...S.td, textAlign: 'center' as const }}>
                            {editing ? (
                              <div style={S.inlineActions}>
                                <button
                                  onClick={guardarEdicion}
                                  disabled={saving || !canSaveEdit}
                                  style={S.btnPrimary(saving || !canSaveEdit)}
                                  type="button"
                                >
                                  <Icon name="save" />
                                  Guardar
                                </button>

                                <button onClick={cancelarEdicion} disabled={saving} style={S.btnSoft(saving)} type="button">
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div style={S.inlineActions}>
                                <button onClick={() => iniciarEdicion(u)} disabled={saving} style={S.btnSoft(saving)} type="button">
                                  <Icon name="edit" />
                                  Editar
                                </button>

                                <button onClick={() => handleDelete(u.id)} disabled={saving} style={S.btnDangerSoft(saving)} type="button">
                                  <Icon name="trash" />
                                  Eliminar
                                </button>
                              </div>
                            )}
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
