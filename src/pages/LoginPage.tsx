import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/home', { replace: true });
    } catch {
      setError('Correo o contraseña incorrectos');
    }
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: 80 }}>Cargando...</p>;
  }

  // ===== ESTILOS BASE =====
  const page = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    background: '#ffffff',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    color: '#0f172a',
  } as const;

  const card = {
    width: '100%',
    maxWidth: 420,
    border: '1px solid #dbe3f1',
    borderRadius: 10,
    padding: '28px 26px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
  } as const;

  const title = {
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: 4,
    lineHeight: 1.2,
  } as const;

  const subtitle = {
    textAlign: 'center' as const,
    fontSize: 14,
    color: '#64748b',
    marginBottom: 22,
  } as const;

  const label = {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
    display: 'block',
  } as const;

  const input = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #dbe3f1',
    fontSize: 14,
    marginBottom: 16,
    outline: 'none',
  } as const;

  const button = {
    width: '100%',
    padding: '11px',
    background: '#0b3fa5',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  } as const;

  const note = {
    marginTop: 18,
    fontSize: 13,
    textAlign: 'center' as const,
    color: '#64748b',
  } as const;

  const errorStyle = {
    marginTop: 10,
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center' as const,
  };

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={title}>Plataforma de Asistencia para los docentes</h1>
        <p style={subtitle}>Instituto Tecnológico de Cancún</p>

        <form onSubmit={handleSubmit}>
          <label style={label}>Email Institucional</label>
          <input
            type="email"
            inputMode='email'
            autoComplete='email'
            placeholder="usuario@cancun.tecnm.mx"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={input}
          />

          <label style={label}>Contraseña</label>
          <input
            type="password"
            autoComplete='current-password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={input}
          />

          <button type="submit" style={button}>
            Iniciar Sesión
          </button>
        </form>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={note}>
          Nota: Los roles son asignados por el administrador de la plataforma
        </div>
      </div>
    </div>
  );
};
