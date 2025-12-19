// src/pages/AdminUsersPage.tsx
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createUser, deleteUser, getUsers, type UserRow } from '../api/users';

const ROLES = [
  'SUB_ACADEMICA',
  'SUB_ADMINISTRATIVA',
  'PREFECTO',
  'RRHH',
  'DIRECTOR',
  'ROOT',
] as const;

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<(typeof ROLES)[number]>('PREFECTO');

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      email.trim().includes('@') &&
      password.trim().length >= 6 &&
      Boolean(rol)
    );
  }, [name, email, password, rol]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los usuarios (¿permisos / token?).');
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

    if (!canSubmit) {
      setError('Completa nombre, correo válido, contraseña (min 6) y rol.');
      return;
    }

    try {
      setSaving(true);

      const nuevo = await createUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        rol,
      });

      // Agrega a la tabla sin recargar
      setUsers(prev => [nuevo, ...prev]);

      // Limpia form
      setName('');
      setEmail('');
      setPassword('');
      setRol('PREFECTO');
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        'Error al crear usuario';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) return;

    try {
      setError('');
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        'Error al eliminar usuario';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  if (loading) return <p style={{ padding: 24, color: 'white' }}>Cargando...</p>;

  return (
    <div style={{ color: 'white', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Administración de roles</h1>

      {/* Formulario crear */}
      <section
        style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 10,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Crear usuario</h2>

        <form onSubmit={handleCreate}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              Nombre
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                style={{ padding: 8 }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Correo
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@dominio.com"
                style={{ padding: 8 }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ padding: 8 }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Rol
              <select
                value={rol}
                onChange={e => setRol(e.target.value as any)}
                style={{ padding: 8 }}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p style={{ color: 'tomato', marginBottom: 8 }}>{error}</p>}

          <button
            type="submit"
            disabled={saving || !canSubmit}
            style={{ padding: '8px 14px', cursor: saving ? 'wait' : 'pointer' }}
          >
            {saving ? 'Guardando...' : 'Crear usuario'}
          </button>

          <button
            type="button"
            onClick={load}
            style={{
              padding: '8px 14px',
              marginLeft: 10,
              cursor: 'pointer',
            }}
          >
            Recargar lista
          </button>
        </form>
      </section>

      {/* Tabla usuarios */}
      <section>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Usuarios</h2>

        {users.length === 0 ? (
          <p>No hay usuarios registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Correo</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Rol</th>
                  <th style={{ padding: 8 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid #2a2a2a' }}>
                    <td style={{ padding: 8 }}>{u.id}</td>
                    <td style={{ padding: 8 }}>{u.name}</td>
                    <td style={{ padding: 8 }}>{u.email}</td>
                    <td style={{ padding: 8 }}>{u.rol}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(u.id)}
                        style={{ padding: '4px 10px', cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
