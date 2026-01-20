import { useAuth } from '../context/authContext';

/* ===============================
   Icon (SVG inline)
================================ */
const Icon = ({ name }: { name: 'home' | 'bolt' | 'note' | 'shield' }) => {
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
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      );
    case 'note':
      return (
        <svg {...common}>
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8M8 12h8M8 16h6" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    default:
      return null;
  }
};

export const HomePage = () => {
  const { user } = useAuth();

  /* ===============================
     Styles (institutional)
  ================================ */
  const styles = {
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
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
      flexWrap: 'wrap' as const,
      marginTop: 8,
    } as const,

    heroLeft: { minWidth: 280 } as const,

    kicker: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
      fontWeight: 550,
      opacity: 0.95,
    } as const,

    h1: {
      margin: '10px 0 0',
      fontSize: 34,
      letterSpacing: -0.7,
      lineHeight: 1.05,
      fontWeight: 550,
    } as const,

    subtitle: {
      margin: '8px 0 0',
      opacity: 0.92,
      fontWeight: 550,
      maxWidth: 860,
      lineHeight: 1.5,
    } as const,

    pillsRow: { marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' as const } as const,

    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 12px',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,.22)',
      background: 'rgba(255,255,255,.16)',
      fontWeight: 550,
      fontSize: 12,
      whiteSpace: 'nowrap' as const,
    } as const,

    dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: '#22c55e',
      boxShadow: '0 0 0 6px rgba(34,197,94,.16)',
      display: 'inline-block',
    } as const,

    accentCube: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: 'rgba(255,255,255,.16)',
      border: '1px solid rgba(255,255,255,.22)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
    } as const,

    grid2: {
      marginTop: 18,
      display: 'grid',
      gap: 14,
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    } as const,

    card: {
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
      flexWrap: 'wrap' as const,
    } as const,

    cardTitle: { margin: 0, fontSize: 16, fontWeight: 550, color: '#0b3fa5' } as const,
    cardDesc: { margin: '6px 0 0', fontSize: 13, color: '#475569', fontWeight: 550 } as const,
    cardBody: { padding: 16 } as const,

    miniCard: {
      border: '1px solid rgba(2,6,23,.10)',
      background: 'rgba(255,255,255,.92)',
      borderRadius: 14,
      padding: 14,
      boxShadow: '0 10px 25px rgba(2,6,23,.05)',
    } as const,

    miniKicker: {
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
      fontWeight: 550,
      color: '#64748b',
    } as const,

    miniTitle: { display: 'block', marginTop: 6, fontWeight: 550 } as const,
    miniSub: { marginTop: 6, color: '#475569', fontWeight: 550, lineHeight: 1.45 } as const,

    pillsSoftRow: { marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' as const } as const,
    pillSoft: {
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
      whiteSpace: 'nowrap' as const,
    } as const,

    systemGrid: {
      marginTop: 14,
      display: 'grid',
      gap: 12,
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    } as const,

    muted: { color: '#64748b', fontWeight: 550, marginTop: 6 } as const,
  };

  return (
    <div style={styles.screen}>
      <div style={styles.page}>
        {/* HERO */}
        <header style={styles.hero}>
          <div style={styles.kicker}>
            <Icon name="home" />
            Inicio
          </div>

          <div style={styles.heroRow}>
            <div style={styles.heroLeft}>
              <h1 style={styles.h1}>
                Bienvenido{user?.name ? `, ${user.name}` : ''}
              </h1>
              <p style={styles.subtitle}>
                Revisa tus módulos disponibles y novedades del sistema.
              </p>

              <div style={styles.pillsRow}>
                <span style={styles.pill}>
                  Rol · <b style={{ fontWeight: 550 }}>{user?.rol ?? 'SIN ROL'}</b>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* CARDS PRINCIPALES */}
        <div style={styles.grid2}>
          {/* Notas */}
          <section style={styles.card}>
            <div style={styles.cardHead}>
              <div>
                <h2 style={styles.cardTitle}>Notas rápidas</h2>
                <p style={styles.cardDesc}>Recomendaciones para navegar sin perderte.</p>
              </div>
              <div style={{ ...styles.accentCube, width: 40, height: 40, borderRadius: 12 }} title="Notas">
                <Icon name="note" />
              </div>
            </div>

            <div style={styles.cardBody}>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, fontWeight: 550, color: '#334155' }}>
                <li>Usa el menú lateral para moverte entre apartados.</li>
                <li>Si intentas entrar a un módulo sin permisos, se te regresará al Home.</li>
                <li>Revisa tus permisos con el Administrador si algo no aparece.</li>
              </ul>

              <div style={styles.pillsSoftRow}>
                <span style={styles.pillSoft}>Tip</span>
                <span style={styles.pillSoft}>Acceso por rol</span>
                <span style={styles.pillSoft}>Rutas protegidas</span>
              </div>
            </div>
          </section>

          {/* Acciones */}
          <section style={styles.card}>
            <div style={styles.cardHead}>
              <div>
                <h2 style={styles.cardTitle}>Acciones sugeridas</h2>
                <p style={styles.cardDesc}>Atajos para empezar rápido.</p>
              </div>
              <div style={{ ...styles.accentCube, width: 40, height: 40, borderRadius: 12 }} title="Acciones">
                <Icon name="bolt" />
              </div>
            </div>

            <div style={styles.cardBody}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={styles.miniCard}>
                  <div style={styles.miniKicker}>Módulo</div>
                  <strong style={styles.miniTitle}>Pase de lista</strong>
                  <div style={styles.miniSub}>
                    Registra asistencias del día y guarda automáticamente la hora.
                  </div>
                </div>

                <div style={styles.miniCard}>
                  <div style={styles.miniKicker}>Módulo</div>
                  <strong style={styles.miniTitle}>Reportes</strong>
                  <div style={styles.miniSub}>
                    Filtra por profesor, carrera y edificio para encontrar datos rápido.
                  </div>
                </div>

                <div style={styles.pillsSoftRow}>
                  <span style={styles.pillSoft}>Rápido</span>
                  <span style={styles.pillSoft}>Seguro</span>
                  <span style={styles.pillSoft}>Trazable</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ESTADO DEL SISTEMA */}
        <section style={{ ...styles.card, marginTop: 14 }}>
          <div style={styles.cardHead}>
            <div>
              <h2 style={styles.cardTitle}>Estado del sistema</h2>
              <p style={styles.cardDesc}>Información general para tener contexto.</p>
            </div>
            <div style={{ ...styles.accentCube, width: 40, height: 40, borderRadius: 12 }} title="Estado">
              <Icon name="shield" />
            </div>
          </div>

          <div style={styles.cardBody}>
            <div style={styles.systemGrid}>
              <div style={styles.miniCard}>
                <div style={styles.miniKicker}>Sesión</div>
                <strong style={styles.miniTitle}>Activa</strong>
                <div style={styles.muted}>Tu token está vigente.</div>
              </div>

              <div style={styles.miniCard}>
                <div style={styles.miniKicker}>Autenticación</div>
                <strong style={styles.miniTitle}>Correcta</strong>
                <div style={styles.muted}>Acceso validado.</div>
              </div>

              <div style={styles.miniCard}>
                <div style={styles.miniKicker}>Permisos</div>
                <strong style={styles.miniTitle}>Según rol</strong>
                <div style={styles.muted}>Se controla por rutas protegidas.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
