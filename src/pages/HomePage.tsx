import { useAuth } from '../context/authContext';

export const HomePage = () => {
  const { user } = useAuth();

  return (
    // Mensaje de Bienvenida
    <div style={{ color: 'white', maxWidth: 900 }}>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Home</h1>

      <p style={{ opacity: 0.85, marginBottom: 18 }}>
        Bienvenido{user?.name ? `, ${user.name}` : ''}. Rol: <b>{user?.rol}</b>
      </p>

      <section
        style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 10,
          padding: 16,
        }}
      >
        {/* Espacio para poner Notas Adicionales */}
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Notas</h2>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
          <li>Usa el menú lateral para navegar entre apartados.</li>
          <li>Si intentas entrar a un módulo sin permisos, se te mandara al Home. Revisa tus permiso con el Administrador</li>
        </ul>
      </section>
    </div>
  );
};
