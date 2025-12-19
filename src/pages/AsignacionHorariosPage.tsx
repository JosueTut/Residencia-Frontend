// src/pages/AsignacionHorariosPage.tsx

import { type FormEvent, useEffect, useState } from 'react';
import { getDocentes, type Docente } from '../api/profesores';
import {
  getHorarios,
  createHorario,
  deleteHorario,
  type Horario,
} from '../api/horarios';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// ---- helper para ordenamiento ----
const ordenarHorarios = (lista: Horario[]) => {
  const getTexto = (valor?: string) => (valor ?? '').toUpperCase();

  const getHoraInicio = (hora: string) => {
    // intenta extraer la primera hora como número
    // ej: "07:00-08:00" -> 7, "7:00" -> 7
    const match = hora.match(/(\d{1,2})(?::\d{2})?/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  return [...lista].sort((a, b) => {
    // 1. Edificio
    const cmpEdificio = getTexto(a.edificio).localeCompare(
      getTexto(b.edificio),
    );
    if (cmpEdificio !== 0) return cmpEdificio;

    // 2. Salón
    const cmpSalon = getTexto(a.aula).localeCompare(getTexto(b.aula));
    if (cmpSalon !== 0) return cmpSalon;

    // 3. Hora
    return getHoraInicio(a.hora_clase) - getHoraInicio(b.hora_clase);
  });
};

export const AsignacionHorariosPage = () => {
  const [profesores, setProfesores] = useState<Docente[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Estado del formulario
  const [profesorId, setProfesorId] = useState<number | ''>('');
  const [diaSemana, setDiaSemana] = useState<string>('Lunes');
  const [horaClase, setHoraClase] = useState<string>('');
  const [salon, setSalon] = useState<string>('');
  const [edificio, setEdificio] = useState<string>('');

  // Filtros
  const [filtroDia, setFiltroDia] = useState<string>('Todos');
  const [filtroEdificio, setFiltroEdificio] = useState<string>('Todos');
  const [filtroHora, setFiltroHora] = useState<string>('Todos');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [profesoresRes, horariosRes] = await Promise.all([
        getDocentes(),
        getHorarios(),
      ]);
      setProfesores(profesoresRes);
      setHorarios(horariosRes);
    } catch (err) {
      console.error(err);
      setError('Error al cargar profesores u horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!profesorId || !horaClase.trim()) {
      setError('Selecciona un profesor y una hora de clase');
      return;
    }

    try {
      setSaving(true);
      const nuevo = await createHorario({
        id_docente: Number(profesorId),
        dia_semana: diaSemana,
        hora_clase: horaClase.trim(),
        aula: salon.trim() || undefined,
        edificio: edificio.trim() || undefined,
      });

      // Añadir a la lista sin recargar todo
      setHorarios(prev => [...prev, nuevo]);

      // Limpiar solo algunos campos
      setHoraClase('');
      setSalon('');
      setEdificio('');
    } catch (err) {
      console.error(err);
      setError('Error al guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este horario?')) return;

    try {
      await deleteHorario(id);
      setHorarios(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el horario');
    }
  };

  // Edificios disponibles según los horarios cargados
  const edificiosDisponibles = Array.from(
    new Set(
      horarios
        .map(h => h.edificio)
        .filter((e): e is string => Boolean(e)),
    ),
  ).sort();

  // Horas disponibles según los horarios cargados
  const horasDisponibles = Array.from(
    new Set(
      horarios
        .map(h => h.hora_clase)
        .filter((h): h is string => Boolean(h)),
    ),
  ).sort();

  if (loading) return <p style={{ padding: 24 }}>Cargando datos...</p>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', color: 'white' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 24 }}>
        Asignación de horarios
      </h1>

      {/* FORMULARIO */}
      <section
        style={{
          marginBottom: 32,
          padding: 16,
          borderRadius: 8,
          backgroundColor: '#222',
        }}
      >
        <h2 style={{ fontSize: '1.4rem', marginBottom: 16 }}>Nuevo horario</h2>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Profesor */}
            <div>
              <label>
                Profesor
                <select
                  value={profesorId}
                  onChange={e =>
                    setProfesorId(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                >
                  <option value="">Selecciona un profesor</option>
                  {profesores.map(p => (
                    <option key={p.id_docente} value={p.id_docente}>
                      {p.nombre} ({p.carrera})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Día de la semana */}
            <div>
              <label>
                Día de la semana
                <select
                  value={diaSemana}
                  onChange={e => setDiaSemana(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                >
                  {DIAS_SEMANA.map(dia => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Hora de clase */}
            <div>
              <label>
                Hora de clase
                <input
                  type="text"
                  placeholder="Ej: 07:00"
                  value={horaClase}
                  onChange={e => setHoraClase(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                />
              </label>
            </div>

            {/* Salón */}
            <div>
              <label>
                Salón
                <input
                  type="text"
                  value={salon}
                  placeholder='Ej: 1'
                  onChange={e => setSalon(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                />
              </label>
            </div>

            {/* Edificio */}
            <div>
              <label>
                Edificio
                <input
                  type="text"
                  value={edificio}
                  placeholder='Ej: Q'
                  onChange={e => setEdificio(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                />
              </label>
            </div>
          </div>

          {error && (
            <p style={{ color: 'tomato', marginBottom: 8 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 16px',
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar horario'}
          </button>
        </form>
      </section>

      {/* TABLAS DE HORARIOS POR DÍA */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: 12 }}>
          Horarios asignados
        </h2>

        {horarios.length === 0 ? (
          <p>No hay horarios registrados.</p>
        ) : (
          <>
            {/* Filtros */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 16,
              }}
            >
              {/* Filtro día */}
              <label>
                Día:{' '}
                <select
                  value={filtroDia}
                  onChange={e => setFiltroDia(e.target.value)}
                  style={{ padding: 4 }}
                >
                  <option value="Todos">Todos</option>
                  {DIAS_SEMANA.map(dia => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </label>

              {/* Filtro edificio */}
              <label>
                Edificio:{' '}
                <select
                  value={filtroEdificio}
                  onChange={e => setFiltroEdificio(e.target.value)}
                  style={{ padding: 4 }}
                >
                  <option value="Todos">Todos</option>
                  {edificiosDisponibles.map(ed => (
                    <option key={ed} value={ed}>
                      {ed}
                    </option>
                  ))}
                </select>
              </label>

              {/* Filtro hora */}
              <label>
                Hora:{' '}
                <select
                  value={filtroHora}
                  onChange={e => setFiltroHora(e.target.value)}
                  style={{ padding: 4 }}
                >
                  <option value="Todos">Todas</option>
                  {horasDisponibles.map(hora => (
                    <option key={hora} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Tablas por día (respetando el filtro de día) */}
            {DIAS_SEMANA.map(dia => {
              if (filtroDia !== 'Todos' && filtroDia !== dia) return null;

              const horariosDelDia = ordenarHorarios(
                horarios.filter(h => {
                  if (h.dia_semana !== dia) return false;
                  if (
                    filtroEdificio !== 'Todos' &&
                    h.edificio !== filtroEdificio
                  )
                    return false;
                  if (
                    filtroHora !== 'Todos' &&
                    h.hora_clase !== filtroHora
                  )
                    return false;
                  return true;
                }),
              );

              if (horariosDelDia.length === 0) return null;

              return (
                <div key={dia} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{dia}</h3>

                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: '#181818',
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Profesor
                          </th>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Carrera
                          </th>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Edificio
                          </th>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Salón
                          </th>
                          <th style={{ textAlign: 'left', padding: 8 }}>
                            Hora
                          </th>
                          <th style={{ padding: 8 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {horariosDelDia.map(h => (
                          <tr key={h.id}>
                            <td style={{ padding: 8 }}>
                              {h.docente?.nombre ?? 'Sin profesor'}
                            </td>
                            <td style={{ padding: 8 }}>
                              {h.docente?.carrera ?? ''}
                            </td>
                            <td style={{ padding: 8 }}>
                              {h.edificio ?? '-'}
                            </td>
                            <td style={{ padding: 8 }}>{h.aula ?? '-'}</td>
                            <td style={{ padding: 8 }}>{h.hora_clase}</td>
                            <td style={{ padding: 8, textAlign: 'center' }}>
                              <button
                                onClick={() => handleDelete(h.id)}
                                style={{
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                }}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
};
