import { useAuth } from '../context/authContext';

export const UserprofilePage = () => {
  const { user } = useAuth();

  // Validación de usuario
  if (!user) {
    return (
      <div style={{ color: 'white' }}>
        <h1>Perfil</h1>
        <p>No hay usuario cargado.</p>
      </div>
    );
  }

  return (
    // Vista principal del perfil
    <div style={{ color: 'white', maxWidth: 700 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Mi perfil</h1>
      <p style={{ opacity: 0.85, marginBottom: 18 }}>
        Información del usuario (solo lectura).
      </p>

      <section
        style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div style={{ display: 'grid', gap: 12 }}>

          {/* Muestra el nombre del Usuario */}
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Nombre</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{user.name}</div>
          </div>

          {/* Muestra el Correo del Usuario */}
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Correo</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{user.email}</div>
          </div>

          {/* Muestra el Rol del Usuario */}
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Rol</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{user.rol}</div>
          </div>
        </div>
      </section>
    </div>
  );
};
