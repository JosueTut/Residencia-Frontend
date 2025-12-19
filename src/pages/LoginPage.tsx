import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export const LoginPage = () => {
  // función que realiza la autenticación (backend)
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Evita recargar la página y Limpia errores previos
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Autenticación y redirige al /Home si los datos son correctos
    try {
      await login(email, password);
      navigate('/home', {replace: true});
    } catch (err: any) {
      console.error(err);
      setError('Correo o contraseña incorrectos');
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1>Iniciar sesión</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ display: 'block', width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', padding: 8 }}
            />
          </label>
        </div>

        <button type="submit" style={{ padding: '8px 16px' }}>
          Entrar
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
    </div>
  );
};
