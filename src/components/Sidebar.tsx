// src/components/Sidebar.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { canAccess } from '../auth/permissions';

type NavItem = {
  label: string;
  path: string;
  icon: 'home' | 'user' | 'clock' | 'check' | 'edit' | 'file' | 'users' | 'building' | 'book' | 'shield';
};

const ITEMS: NavItem[] = [
  { label: 'Home', path: '/home', icon: 'home' },
  { label: 'Perfil', path: '/profile', icon: 'user' },
  { label: 'Asignación de horarios', path: '/horarios', icon: 'clock' },
  { label: 'Pase de lista', path: '/pase-lista', icon: 'check' },
  { label: 'Modificación de Asistencias', path: '/asistencias', icon: 'edit' },
  { label: 'Generador de Reportes', path: '/reporte', icon: 'file' },
  { label: 'Docentes', path: '/docentes', icon: 'users' },
  { label: 'Edificios', path: '/edificios', icon: 'building' },
  { label: 'Carreras', path: '/carreras', icon: 'book' },
  { label: 'Administrador de roles', path: '/admin', icon: 'shield' },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

const Icon = ({ name }: { name: NavItem['icon'] }) => {
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
    case 'user':
      return (
        <svg {...common}>
          <path d="M20 21a8 8 0 1 0-16 0" />
          <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <path d="M12 8v5l3 2" />
          <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case 'file':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8M8 17h8" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <path d="M17 21v-1a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v1" />
          <path d="M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
          <path d="M23 21v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'building':
      return (
        <svg {...common}>
          <path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
          <path d="M7 6h2M7 10h2M7 14h2M7 18h2" />
          <path d="M17 22V8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14" />
          <path d="M21 10h-2M21 14h-2M21 18h-2" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 19a2 2 0 0 0 2 2h14" />
          <path d="M6 2h14v18H6a2 2 0 0 0-2 2V4a2 2 0 0 1 2-2Z" />
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

const S = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(2,6,23,.55)',
    zIndex: 120,
  },

  // ✅ Pegado arriba + alto completo
  asideBase: {
    position: 'sticky' as const,
    top: 0,
    height: '100vh',
    width: 290,
    borderRadius: 6,
    overflow: 'hidden' as const,
    border: '1px solid #dbe7ff',
    boxShadow: '0 18px 55px rgba(2,6,23,.10)',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
  },

  // ✅ Drawer móvil sin márgenes (para que no quede “flotando”)
  asideMobile: (open: boolean) =>
    ({
      position: 'fixed' as const,
      top: 0,
      left: 0,
      height: '100vh',
      width: 'min(320px, 92vw)',
      transform: open ? 'translateX(0)' : 'translateX(-110%)',
      transition: 'transform .22s ease',
      zIndex: 130,
      borderRadius: 18,
      margin: 0,
    } as const),

  header: {
    padding: 16,
    color: '#fff',
    background: 'linear-gradient(180deg, #1d4ed8 0%, #3b82f6 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)',
  } as const,

  brandRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  } as const,

  brandLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  } as const,

  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: 'rgba(255,255,255,.16)',
    border: '1px solid rgba(255,255,255,.22)',
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 auto',
  } as const,

  brandTitle: { fontWeight: 800, letterSpacing: -0.3, fontSize: 16, lineHeight: 1.1 } as const,
  brandSub: { marginTop: 2, fontSize: 12, fontWeight: 550, opacity: 0.92 } as const,

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,.22)',
    background: 'rgba(255,255,255,.14)',
    color: '#fff',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 900,
  } as const,

  userBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,.22)',
    background: 'rgba(255,255,255,.12)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as const,

  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  } as const,

  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,.22)',
    background: 'rgba(255,255,255,.14)',
    fontWeight: 700,
    fontSize: 12,
  } as const,

  // ✅ Importante: minHeight: 0 para que overflowY funcione dentro de flex
  body: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    flex: 1,
    minHeight: 0,
    background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
  } as const,

  // ✅ Este es el contenedor scrolleable del menú
  navScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto' as const,
    paddingRight: 2,
  } as const,

  navWrap: {
    borderRadius: 16,
    border: '1px solid #dbe3f1',
    background: '#fff',
    boxShadow: '0 12px 30px rgba(2,6,23,.06)',
    overflow: 'hidden' as const,
  } as const,

  navTitle: {
    padding: '12px 12px',
    borderBottom: '1px solid #eef2ff',
    background: '#eef6ff',
    color: '#0b3fa5',
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase' as const,
  } as const,

  navBtn: (active: boolean) =>
    ({
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 12px',
      border: 'none',
      borderBottom: '1px solid #f1f5f9',
      background: active ? 'rgba(37,99,235,.10)' : '#fff',
      color: active ? '#0b3fa5' : '#0f172a',
      cursor: 'pointer',
      fontWeight: 750,
      textAlign: 'left' as const,
      outline: 'none',
    } as const),

  navIcon: (active: boolean) =>
    ({
      width: 34,
      height: 34,
      borderRadius: 12,
      display: 'grid',
      placeItems: 'center',
      border: '1px solid #dbe3f1',
      background: active ? 'rgba(37,99,235,.12)' : '#fff',
      color: active ? '#1d4ed8' : '#334155',
      flex: '0 0 auto',
    } as const),

  footer: {
    padding: 12,
    borderTop: '1px solid #eef2ff',
    background: '#fff',
  } as const,

  logout: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 14,
    border: '1px solid rgba(239,68,68,.30)',
    background: 'rgba(239,68,68,.08)',
    color: '#b91c1c',
    fontWeight: 800,
    cursor: 'pointer',
  } as const,
};

export const Sidebar = ({ open = false, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Responsive sin CSS externo
  const [w, setW] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const isMobile = w < 980;

  const role = user?.rol;

  const visibleItems = useMemo(() => {
    return ITEMS.filter(i => canAccess(i.path, role));
  }, [role]);

  const go = (path: string) => {
    const ok = canAccess(path, role);
    if (!ok) {
      navigate('/home', { replace: true, state: { noAccessFrom: path } });
      onClose?.();
      return;
    }
    navigate(path);
    onClose?.();
  };

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const asideStyle = isMobile ? { ...S.asideBase, ...S.asideMobile(open) } : S.asideBase;

  return (
    <>
      {/* Overlay (solo móvil cuando está abierto) */}
      {isMobile && open ? (
        <div style={S.overlay} onClick={onClose} role="button" tabIndex={0} aria-label="Cerrar menú" />
      ) : null}

      <aside style={asideStyle} aria-label="Sidebar">
        {/* HEADER */}
        <div style={S.header}>
          <div style={S.brandRow}>
            <div style={S.brandLeft}>
              <div style={S.brandIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10L12 5 2 10l10 5 10-5Z" />
                  <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
                </svg>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={S.brandTitle}>Residencia</div>
                <div style={S.brandSub}>Plataforma de asistencia</div>
              </div>
            </div>

            {/* ✅ Solo móvil */}
            {isMobile ? (
              <button type="button" onClick={onClose} style={S.closeBtn} aria-label="Cerrar menú" title="Cerrar">
                ✕
              </button>
            ) : null}
          </div>

          <div style={S.userBox}>
            <div style={S.userRow}>
              <span style={{ fontWeight: 900 }}>{user?.name ?? 'Usuario'}</span>
              <span style={{ opacity: 0.55 }}>•</span>
              <span style={S.pill}>{role ?? 'SIN ROL'}</span>
            </div>

            <div style={{ fontSize: 12, fontWeight: 650, opacity: 0.92 }}>
              ¡Bienvenidos!.
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={S.body}>
          {/* ✅ zona scrolleable */}
          <div style={S.navScroll}>
            <div style={S.navWrap}>
              <div style={S.navTitle}>Navegación</div>

              {visibleItems.map(item => {
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => go(item.path)}
                    style={S.navBtn(active)}
                    title={item.label}
                  >
                    <span style={S.navIcon(active)}>
                      <Icon name={item.icon} />
                    </span>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={S.footer}>
          <button
            type="button"
            style={S.logout}
            onClick={() => {
              logout();
              navigate('/login');
              onClose?.();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};
