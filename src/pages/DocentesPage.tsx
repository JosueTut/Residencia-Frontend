import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createDocente, deleteDocente, getDocentes, type Docente } from '../api/profesores';

export const DocentesPage = () => {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // form
  const [nombre, setNombre] = useState('');
  const [carrera, setCarrera] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDocentes();
      setDocentes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Error al cargar docentes');
      setDocentes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Ordenar por carrera (y dentro por nombre)
  const docentesOrdenados = useMemo(() => {
    const txt = (v?: string) => (v ?? '').toUpperCase().trim();

    return [...docentes].sort((a, b) => {
      const c = txt(a.carrera).localeCompare(txt(b.carrera));
      if (c !== 0) return c;
      return txt(a.nombre).localeCompare(txt(b.nombre));
    });
  }, [docentes]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim() || !carrera.trim()) {
      setError('Nombre y carrera son requeridos');
      return;
    }

    try {
      setSaving(true);
      const nuevo = await createDocente({
        nombre: nombre.trim(),
        carrera: carrera.trim(),
      });

      // Agrega al estado sin recargar
      setDocentes(prev => [...prev, nuevo]);

      setNombre('');
      setCarrera('');
    } catch (e) {
      console.error(e);
      setError('Error al crear docente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este docente?')) return;

    try {
      await deleteDocente(id);
      setDocentes(prev => prev.filter(d => d.id_docente !== id));
    } catch (e) {
      console.error(e);
      setError('Error al eliminar docente');
    }
  };

  if (loading) return <p style={{ padding: 24, color: 'white' }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', color: 'white' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: 16 }}>Docentes</h1>

      {/* Form */}
      <section style={{ background: '#222', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Agregar docente</h2>

        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              Nombre
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
                placeholder="Ej: Juan Manuel Ucan Cih"
              />
            </label>

            <label>
              Carrera
              <input
                value={carrera}
                onChange={e => setCarrera(e.target.value)}
                style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
                placeholder="Ej: Ingeniería en Sistemas Computacionales"
              />
            </label>
          </div>

          {error && <p style={{ color: 'tomato', marginTop: 10 }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            style={{ marginTop: 12, padding: '8px 14px', cursor: saving ? 'wait' : 'pointer' }}
          >
            {saving ? 'Guardando...' : 'Guardar docente'}
          </button>
        </form>
      </section>

      {/* Lista */}
      <section>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Lista de docentes</h2>

        {docentesOrdenados.length === 0 ? (
          <p>No hay docentes registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Carrera</th>
                  <th style={{ padding: 8 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docentesOrdenados.map(d => (
                  <tr key={d.id_docente} style={{ borderTop: '1px solid #333' }}>
                    <td style={{ padding: 8 }}>{d.nombre}</td>
                    <td style={{ padding: 8 }}>{d.carrera}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(d.id_docente)}
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
