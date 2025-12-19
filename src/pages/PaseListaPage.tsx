import { useEffect, useMemo, useState } from 'react';
import {
  getPaseLista,
  guardarPaseLista,
  type EstadoAsistencia,
  type PaseListaItem,
} from '../api/asistencias';

const ESTADOS: { value: EstadoAsistencia; label: string }[] = [
  { value: 'PRESENTE', label: 'Presente' },
  { value: 'AUSENTE', label: 'Ausente' },
  { value: 'RETARDO', label: 'Retardo' },
  { value: 'INCAPACIDAD', label: 'Incapacidad' },
  { value: 'COMISION', label: 'Comisión' },
];

export const PaseListaPage = () => {
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const [horarios, setHorarios] = useState<PaseListaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Estado por horario
  const [estadoPorHorario, setEstadoPorHorario] = useState<
    Record<number, EstadoAsistencia>
  >({});
  const [notaPorHorario, setNotaPorHorario] = useState<Record<number, string>>(
    {},
  );

  // (Opcional) filtro por hora para facilitar el pase de lista
  const [filtroHora, setFiltroHora] = useState<string>('Todas');

  const horasDisponibles = useMemo(() => {
    const set = new Set(horarios.map(h => h.horaClase).filter(Boolean));
    return ['Todas', ...Array.from(set).sort()];
  }, [horarios]);

  const horariosFiltrados = useMemo(() => {
    const lista =
      filtroHora === 'Todas'
        ? horarios
        : horarios.filter(h => h.horaClase === filtroHora);

    // Orden: edificio -> salón -> hora
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

      const cmpSalon = num(a.salon) - num(b.salon);
      if (cmpSalon !== 0) return cmpSalon;

      return horaInicio(a.horaClase) - horaInicio(b.horaClase);
    });
  }, [horarios, filtroHora]);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      setMensaje('');

      const data = await getPaseLista(fecha);
      setHorarios(data);

      // Inicializa defaults: PRESENTE
      const estadoInit: Record<number, EstadoAsistencia> = {};
      const notaInit: Record<number, string> = {};

      data.forEach(h => {
        estadoInit[h.idHorario] = estadoPorHorario[h.idHorario] ?? 'PRESENTE';
        notaInit[h.idHorario] = notaPorHorario[h.idHorario] ?? '';
      });

      setEstadoPorHorario(estadoInit);
      setNotaPorHorario(notaInit);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setError('');
      setMensaje('');

      const registros = horariosFiltrados.map(h => ({
        idHorario: h.idHorario,
        estado: estadoPorHorario[h.idHorario] ?? 'PRESENTE',
        notaAdicional: (notaPorHorario[h.idHorario] ?? '').trim() || undefined,
      }));

      await guardarPaseLista({ fecha, registros });
      setMensaje('✅ Pase de lista guardado correctamente');
    } catch (e) {
      console.error(e);
      setError('Error al guardar el pase de lista');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', color: 'white' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 16 }}>Pase de lista</h1>

      {/* Controles */}
      <section
        style={{
          padding: 16,
          borderRadius: 8,
          backgroundColor: '#222',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <label>
            Fecha
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                padding: 8,
                marginTop: 4,
              }}
            />
          </label>

          <label>
            Hora (filtro)
            <select
              value={filtroHora}
              onChange={e => setFiltroHora(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                padding: 8,
                marginTop: 4,
              }}
            >
              {horasDisponibles.map(h => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={cargar}
            disabled={loading}
            style={{
              padding: '10px 16px',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {error && <p style={{ color: 'tomato', marginTop: 12 }}>{error}</p>}
        {mensaje && <p style={{ color: 'lightgreen', marginTop: 12 }}>{mensaje}</p>}
      </section>

      {/* Tabla */}
      <section>
        <h2 style={{ fontSize: '1.4rem', marginBottom: 12 }}>
          Horarios del día
        </h2>

        {loading ? (
          <p>Cargando...</p>
        ) : horariosFiltrados.length === 0 ? (
          <p>No hay horarios para esta fecha.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Profesor</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Carrera</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Edificio</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Salón</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Hora</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Estado</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Nota</th>
                </tr>
              </thead>

              <tbody>
                {horariosFiltrados.map(h => (
                  <tr key={h.idHorario}>
                    <td style={{ padding: 8 }}>{h.profesor}</td>
                    <td style={{ padding: 8 }}>{h.carrera ?? ''}</td>
                    <td style={{ padding: 8 }}>{h.edificio ?? '-'}</td>
                    <td style={{ padding: 8 }}>{h.salon ?? '-'}</td>
                    <td style={{ padding: 8 }}>{h.horaClase}</td>

                    <td style={{ padding: 8 }}>
                      <select
                        value={estadoPorHorario[h.idHorario] ?? 'PRESENTE'}
                        onChange={e =>
                          setEstadoPorHorario(prev => ({
                            ...prev,
                            [h.idHorario]: e.target.value as EstadoAsistencia,
                          }))
                        }
                        style={{ padding: 6 }}
                      >
                        {ESTADOS.map(op => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: 8 }}>
                      <input
                        value={notaPorHorario[h.idHorario] ?? ''}
                        onChange={e =>
                          setNotaPorHorario(prev => ({
                            ...prev,
                            [h.idHorario]: e.target.value,
                          }))
                        }
                        placeholder="Opcional"
                        style={{ width: '100%', padding: 6 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleGuardar}
            disabled={guardando || horariosFiltrados.length === 0}
            style={{
              padding: '10px 16px',
              cursor: guardando ? 'wait' : 'pointer',
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar pase de lista'}
          </button>
        </div>
      </section>
    </div>
  );
};
