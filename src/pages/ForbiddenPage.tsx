import { useLocation, useNavigate } from 'react-router-dom';

export const ForbiddenPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const from = (location.state as any)?.from;

  return (
    <div style={{ color: 'white' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>No tienes acceso</h1>
      <p style={{ opacity: 0.9 }}>
        No tienes permiso para entrar a este apartado.
      </p>

      {from && (
        <p style={{ opacity: 0.7, marginTop: 8 }}>
          Intentaste entrar a: <b>{from}</b>
        </p>
      )}

      <button
        onClick={() => navigate('/home', { replace: true })}
        style={{
          marginTop: 16,
          padding: '10px 12px',
          borderRadius: 8,
          background: '#222',
          color: 'white',
          border: '1px solid #2a2a2a',
          cursor: 'pointer',
        }}
      >
        Volver al inicio
      </button>
    </div>
  );
};
