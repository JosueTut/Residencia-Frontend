import { useEffect, useMemo, useState } from 'react';
import {
  getAsistenciasPorFecha,
  updateAsistencia,
  type AsistenciaRow,
} from '../api/asistencias';

const ESTADOS = [
  'PRESENTE',
  'AUSENTE',
  'RETARDO',
  'INCAPACIDAD',
  'COMISION',
  'SUSPENDIDO',
];

export const RegistroAsistenciasPage = () => {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<AsistenciaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // drafts
  const [estadoDraft, setEstadoDraft] = useState<Record<number, string>>({});
  const [notaDraft, setNotaDraft] = useState<Record<number, string>>({});

  // editing flags
  const [dirty, setDirty] = useState<Record<number, boolean>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  // filtros
  const [fEstado, setFEstado] = useState('Todos');
  const [fEdificio, setFEdificio] = useState('Todos');
  const [fHora, setFHora] = useState('Todos');

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      setMensaje('');

      const data = await getAsistenciasPorFecha(fecha);
      const list = Array.isArray(data) ? data : [];

      setRows(list);

      // precargar drafts + limpiar dirty
      const nextEstado: Record<number, string> = {};
      const nextNota: Record<number, string> = {};
      const nextDirty: Record<number, boolean> = {};

      list.forEach(a => {
        nextEstado[a.idAsistencia] = a.estado ?? 'PRESENTE';
        nextNota[a.idAsistencia] = a.nota ?? '';
        nextDirty[a.idAsistencia] = false;
      });

      setEstadoDraft(nextEstado);
      setNotaDraft(nextNota);
      setDirty(nextDirty);
    } catch (e) {
      console.error(e);
      setError('Error al cargar asistencias.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const edificiosDisponibles = useMemo(() => {
    return Array.from(
      new Set(rows.map(r => r.edificio).filter(Boolean)),
    ).sort();
  }, [rows]);

  const horasDisponibles = useMemo(() => {
    return Array.from(new Set(rows.map(r => r.horaClase).filter(Boolean))).sort();
  }, [rows]);

  const rowsFiltradas = useMemo(() => {
    return rows.filter(r => {
      if (fEstado !== 'Todos' && (estadoDraft[r.idAsistencia] ?? r.estado) !== fEstado) return false;
      if (fEdificio !== 'Todos' && r.edificio !== fEdificio) return false;
      if (fHora !== 'Todos' && r.horaClase !== fHora) return false;
      return true;
    });
  }, [rows, fEstado, fEdificio, fHora, estadoDraft]);

  const totalDirty = useMemo(() => {
    return Object.values(dirty).filter(Boolean).length;
  }, [dirty]);

  const markDirty = (id: number) => {
    setDirty(prev => ({ ...prev, [id]: true }));
  };

  const onSaveRow = async (idAsistencia: number) => {
    try {
      setSavingId(idAsistencia);
      setError('');
      setMensaje('');

      const payload = {
        estado: estadoDraft[idAsistencia],
        notaAdicional: notaDraft[idAsistencia],
      };

      await updateAsistencia(idAsistencia, payload);

      // aplicar en tabla
      setRows(prev =>
        prev.map(r =>
          r.idAsistencia === idAsistencia
            ? { ...r, estado: payload.estado, nota: payload.notaAdicional ?? '' }
            : r,
        ),
      );

      setDirty(prev => ({ ...prev, [idAsistencia]: false }));
      setMensaje('Asistencia actualizada ✅');
    } catch (e) {
      console.error(e);
      setError('Error al actualizar la asistencia.');
    } finally {
      setSavingId(null);
    }
  };

  const onSaveAll = async () => {
    const ids = Object.keys(dirty)
      .map(Number)
      .filter(id => dirty[id]);

    if (ids.length === 0) {
      setMensaje('No hay cambios por guardar.');
      return;
    }

    try {
      setSavingAll(true);
      setError('');
      setMensaje('');

      // Guardar uno por uno (simple y seguro)
      for (const id of ids) {
        const payload = {
          estado: estadoDraft[id],
          notaAdicional: notaDraft[id],
        };
        await updateAsistencia(id, payload);

        // actualizar rows localmente
        setRows(prev =>
          prev.map(r =>
            r.idAsistencia === id
              ? { ...r, estado: payload.estado, nota: payload.notaAdicional ?? '' }
              : r,
          ),
        );

        setDirty(prev => ({ ...prev, [id]: false }));
      }

      setMensaje(`Cambios guardados (${ids.length}) ✅`);
    } catch (e) {
      console.error(e);
      setError('Error al guardar todos los cambios.');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div style={{ color: 'white' }}>
      <h1>Asistencias</h1>
      <p>Aquí se muestran las asistencias tomadas y puedes corregirlas.</p>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          Fecha:{' '}
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </label>

        <button onClick={cargar} disabled={loading}>
          {loading ? 'Cargando...' : 'Recargar'}
        </button>

        <button onClick={onSaveAll} disabled={savingAll || totalDirty === 0}>
          {savingAll ? 'Guardando...' : `Guardar todo (${totalDirty})`}
        </button>

        <span style={{ opacity: 0.85 }}>
          Total: {rows.length} | Mostrando: {rowsFiltradas.length}
        </span>
      </div>

      {/* Filtros */}
      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label>
          Estado:{' '}
          <select value={fEstado} onChange={e => setFEstado(e.target.value)}>
            <option value="Todos">Todos</option>
            {ESTADOS.map(es => (
              <option key={es} value={es}>{es}</option>
            ))}
          </select>
        </label>

        <label>
          Edificio:{' '}
          <select value={fEdificio} onChange={e => setFEdificio(e.target.value)}>
            <option value="Todos">Todos</option>
            {edificiosDisponibles.map(ed => (
              <option key={ed} value={ed}>{ed}</option>
            ))}
          </select>
        </label>

        <label>
          Hora:{' '}
          <select value={fHora} onChange={e => setFHora(e.target.value)}>
            <option value="Todos">Todos</option>
            {horasDisponibles.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p style={{ color: 'tomato' }}>{error}</p>}
      {mensaje && <p style={{ color: 'lightgreen' }}>{mensaje}</p>}

      {loading ? (
        <p>Cargando...</p>
      ) : rowsFiltradas.length === 0 ? (
        <p>No hay asistencias para mostrar con esos filtros.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
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
                <th style={{ padding: 8 }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rowsFiltradas.map(r => {
                const isDirty = !!dirty[r.idAsistencia];

                return (
                  <tr
                    key={r.idAsistencia}
                    style={{
                      borderTop: '1px solid #333',
                      opacity: isDirty ? 1 : 0.92,
                    }}
                  >
                    <td style={{ padding: 8 }}>
                      {r.profesor} {isDirty ? '✳️' : ''}
                    </td>
                    <td style={{ padding: 8 }}>{r.carrera}</td>
                    <td style={{ padding: 8 }}>{r.edificio}</td>
                    <td style={{ padding: 8 }}>{r.salon}</td>
                    <td style={{ padding: 8 }}>{r.horaClase}</td>

                    <td style={{ padding: 8 }}>
                      <select
                        value={estadoDraft[r.idAsistencia] ?? r.estado ?? 'PRESENTE'}
                        onChange={e => {
                          setEstadoDraft(prev => ({
                            ...prev,
                            [r.idAsistencia]: e.target.value,
                          }));
                          markDirty(r.idAsistencia);
                        }}
                      >
                        {ESTADOS.map(es => (
                          <option key={es} value={es}>{es}</option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: 8 }}>
                      <input
                        value={notaDraft[r.idAsistencia] ?? r.nota ?? ''}
                        onChange={e => {
                          setNotaDraft(prev => ({
                            ...prev,
                            [r.idAsistencia]: e.target.value,
                          }));
                          markDirty(r.idAsistencia);
                        }}
                        placeholder="Opcional"
                        style={{ width: 240 }}
                      />
                    </td>

                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button
                        onClick={() => onSaveRow(r.idAsistencia)}
                        disabled={savingId === r.idAsistencia}
                      >
                        {savingId === r.idAsistencia ? 'Guardando...' : 'Guardar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p style={{ marginTop: 8, opacity: 0.8 }}>
            ✳️ = fila con cambios pendientes por guardar
          </p>
        </div>
      )}
    </div>
  );
};
