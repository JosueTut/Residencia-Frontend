import { useAuth } from '../context/authContext';

/* ===============================
   Icon (SVG inline)
================================ */
const Icon = ({ name }: { name: 'user' | 'shield' | 'mail' }) => {
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
    case 'user':
      return (
        <svg {...common}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...common}>
          <path d="M4 4h16v16H4z" />
          <path d="m22 6-10 7L2 6" />
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

export const UserprofilePage = () => {
  const { user } = useAuth();

  /* ===============================
     Styles (match new theme)
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
      maxWidth: 980,
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

    heroLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      minWidth: 280,
    } as const,

    heroIconCircle: {
      width: 54,
      height: 54,
      borderRadius: 999,
      background: 'rgba(255,255,255,.16)',
      display: 'grid',
      placeItems: 'center',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)',
    } as const,

    h1: {
      margin: 0,
      fontSize: 34,
      letterSpacing: -0.7,
      lineHeight: 1.05,
      fontWeight: 550,
    } as const,

    sub: {
      margin: '6px 0 0',
      opacity: 0.92,
      fontWeight: 550,
      maxWidth: 860,
    } as const,

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
      flexWrap: 'wrap' as const,
    } as const,

    headLeft: { display: 'inline-flex', alignItems: 'center', gap: 10 } as const,

    cardSub: {
      margin: 0,
      fontSize: 12,
      color: '#0b3fa5',
      opacity: 0.9,
      fontWeight: 550,
    } as const,

    body: { padding: 16 } as const,

    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: 12,
    } as const,

    field: {
      gridColumn: 'span 12',
      borderRadius: 14,
      border: '1px solid rgba(2, 6, 23, .08)',
      background: 'rgba(255,255,255,.96)',
      padding: 14,
      boxShadow: '0 1px 0 rgba(255,255,255,.9) inset',
    } as const,

    // 2 columnas en pantallas medianas
    fieldHalf: {
      gridColumn: 'span 12',
    } as const,

    label: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12,
      color: '#475569',
      letterSpacing: 0.2,
      fontWeight: 550,
      marginBottom: 8,
      textTransform: 'uppercase' as const,
    } as const,

    value: {
      fontSize: 16,
      fontWeight: 550,
      color: '#0f172a',
      lineHeight: 1.25,
      wordBreak: 'break-word' as const,
    } as const,

    pillRole: {
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

    footer: {
      padding: 14,
      borderTop: '1px solid rgba(2,6,23,.06)',
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap' as const,
      alignItems: 'center',
      justifyContent: 'space-between',
      color: '#64748b',
      fontSize: 12,
      fontWeight: 550,
    } as const,

    hint: { opacity: 0.9 } as const,
  };

  // No user
  if (!user) {
    return (
      <div style={styles.screen}>
        <div style={styles.page}>
          <header style={styles.hero}>
            <div style={styles.heroRow}>
              <div style={styles.heroLeft}>
                <div style={styles.heroIconCircle}>
                  <Icon name="user" />
                </div>
                <div>
                  <h1 style={styles.h1}>Perfil</h1>
                  <div style={styles.sub}>No hay usuario cargado.</div>
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.screen}>
      <div style={styles.page}>
        {/* HERO */}
        <header style={styles.hero}>
          <div style={styles.heroRow}>
            <div style={styles.heroLeft}>
              <div style={styles.heroIconCircle}>
                <Icon name="user" />
              </div>
              <div>
                <h1 style={styles.h1}>Mi perfil</h1>
                <div style={styles.sub}>Información del usuario (solo lectura).</div>
              </div>
            </div>
          </div>
        </header>

        {/* CARD */}
        <section style={styles.card}>
          <div style={styles.cardHead}>
            <div style={styles.headLeft}>
              <Icon name="shield" />
              Datos de la cuenta
            </div>
            <p style={styles.cardSub}>Verifica que tu información sea correcta.</p>
          </div>

          <div style={styles.body}>
            <div style={styles.grid}>
              <div style={styles.field}>
                <div style={styles.label}>
                  <Icon name="user" /> Nombre
                </div>
                <div style={styles.value}>{user.name}</div>
              </div>

              <div style={styles.field}>
                <div style={styles.label}>
                  <Icon name="mail" /> Correo
                </div>
                <div style={styles.value}>{user.email}</div>
              </div>

              <div style={styles.field}>
                <div style={styles.label}>
                  <Icon name="shield" /> Rol
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={styles.pillRole}>{user.rol}</span>
                  <span style={{ color: '#64748b', fontWeight: 550, fontSize: 12 }}>
                    (Define permisos y accesos)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.footer}>
            <span style={styles.hint}>
              Tip: si no ves un módulo, revisa tus permisos con el Administrador.
            </span>
            <span>Residencia · Panel administrativo</span>
          </div>
        </section>
      </div>

      {/* Responsive: 2 columnas en pantallas medianas (CSS inline via media no existe),
          pero si quieres, lo hacemos con una clase global o con useWindowWidth como en AdminUsers. */}
    </div>
  );
};
