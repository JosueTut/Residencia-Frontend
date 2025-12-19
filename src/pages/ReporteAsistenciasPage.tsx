import { useEffect, useMemo, useState } from 'react';
import { getReporteAsistencias, type ReporteAsistenciaItem } from '../api/asistencias';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReporteAsistenciasPage = () => {
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<ReporteAsistenciaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getReporteAsistencias(fecha);
      setData(res);
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
  }, [fecha]);

  const dataOrdenada = useMemo(() => {
    const text = (v?: string) => (v ?? '').toUpperCase();
    const horaNum = (v?: string) => {
      const m = (v ?? '').match(/(\d{1,2})(?::\d{2})?/);
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
    };

    return [...data].sort((a, b) => {
      const e = text(a.edificio).localeCompare(text(b.edificio));
      if (e !== 0) return e;

      const s = text(a.salon).localeCompare(text(b.salon));
      if (s !== 0) return s;

      return horaNum(a.horaClase) - horaNum(b.horaClase);
    });
  }, [data]);

  const generarPDF = () => {
    const doc = new jsPDF();

    // ===== Helpers =====
    const now = new Date();
    const generadoEl = now.toLocaleString(); // simple (local)
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const getEstado = (r: ReporteAsistenciaItem) =>
      String((r as any).estado ?? '').toUpperCase().trim();

    // ===== KPIs =====
    const total = dataOrdenada.length;
    const conteo: Record<string, number> = {};
    for (const r of dataOrdenada) {
      const estado = getEstado(r) || 'SIN_ESTADO';
      conteo[estado] = (conteo[estado] ?? 0) + 1;
    }

    // Si quieres priorizar algunos estados “comunes”
    const estadosPreferidos = ['PRESENTE', 'AUSENTE', 'RETARDO', 'INCAPACIDAD', 'COMISION', 'SUSPENDIDO'];
    const estadosFinal = [
      ...estadosPreferidos.filter(e => conteo[e]),
      ...Object.keys(conteo).filter(e => !estadosPreferidos.includes(e)),
    ];

    // ===== Encabezado simple =====
    doc.setFontSize(14);
    doc.text(`Reporte de asistencias`, 14, 14);
    doc.setFontSize(11);
    doc.text(`Fecha: ${fecha}`, 14, 20);

    // ===== Caja KPI =====
    // cuadro
    const boxX = 14;
    const boxY = 26;
    const boxW = pageW - 28;
    const boxH = 18;

    doc.setDrawColor(180);
    doc.rect(boxX, boxY, boxW, boxH);

    doc.setFontSize(11);
    doc.text(`Resumen`, boxX + 2, boxY + 6);
    doc.setFontSize(10);

    // primera línea: Total
    doc.text(`Total: ${total}`, boxX + 2, boxY + 13);

    // segunda línea: estados (compacto)
    const resumenEstados = estadosFinal
      .map(e => `${e}: ${conteo[e]}`)
      .join('   ');

    // Si se pasa, lo partimos (muy simple)
    const lines = doc.splitTextToSize(resumenEstados, boxW - 4);
    doc.text(lines, boxX + 2, boxY + 17);

    // ===== Tabla =====
    autoTable(doc, {
      startY: boxY + boxH + 6,
      head: [[
        'Profesor', 'Carrera', 'Edificio', 'Salón', 'Hora', 'Estado', 'Nota'
      ]],
      body: dataOrdenada.map(r => ([
        r.profesor,
        r.carrera ?? '',
        r.edificio ?? '',
        r.salon ?? '',
        r.horaClase ?? '',
        (r as any).estado ?? '',
        (r as any).notaAdicional ?? '',
      ])),
      // deja espacio abajo para el footer
      margin: { bottom: 18 },

      // ===== Footer en cada página =====
      didDrawPage: () => {
        const pageNumber = doc.getNumberOfPages();
        doc.setFontSize(9);

        // linea separadora
        doc.setDrawColor(80);
        doc.line(14, pageH - 14, pageW - 14, pageH - 14);

        // izquierda: generado
        doc.text(`Generado el: ${generadoEl}`, 14, pageH - 8);

        // derecha: paginación (temporal, luego se reemplaza con total)
        doc.text(`Página ${pageNumber} de __`, pageW - 14, pageH - 8, { align: 'right' });
      },
    });

    // ===== Reemplazar "__" por total de páginas =====
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(`Página ${i} de ${totalPages}`, pageW - 14, pageH - 8, { align: 'right' });
    }

    doc.save(`reporte-asistencias-${fecha}.pdf`);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', color: 'white' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 16 }}>
        Reporte de asistencias
      </h1>

      <section
        style={{
          padding: 16,
          borderRadius: 8,
          backgroundColor: '#222',
          marginBottom: 24,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'end',
        }}
      >
        <label>
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            style={{ display: 'block', padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          onClick={cargar}
          disabled={loading}
          style={{ padding: '10px 16px', cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>

        <button
          onClick={generarPDF}
          disabled={dataOrdenada.length === 0}
          style={{ padding: '10px 16px', cursor: 'pointer' }}
        >
          Generar PDF
        </button>

        {error && <p style={{ color: 'tomato', margin: 0 }}>{error}</p>}
      </section>

      {loading ? (
        <p>Cargando...</p>
      ) : dataOrdenada.length === 0 ? (
        <p>No hay asistencias registradas para esta fecha.</p>
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
              {dataOrdenada.map(r => (
                <tr key={r.idAsistencia}>
                  <td style={{ padding: 8 }}>{r.profesor}</td>
                  <td style={{ padding: 8 }}>{r.carrera ?? ''}</td>
                  <td style={{ padding: 8 }}>{r.edificio ?? ''}</td>
                  <td style={{ padding: 8 }}>{r.salon ?? ''}</td>
                  <td style={{ padding: 8 }}>{r.horaClase ?? ''}</td>
                  <td style={{ padding: 8 }}>{(r as any).estado}</td>
                  <td style={{ padding: 8 }}>{(r as any).notaAdicional ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
