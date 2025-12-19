import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { AuthProvider } from './context/authContext.tsx'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(

  // Ayuda a detectar errores y malas prácticas
  <React.StrictMode>
    {/* Proveedor global de autenticación, Aquí se gestiona el usuario, token y rol */}
    <AuthProvider>
      <BrowserRouter>
        {/* Componente principal de la aplicación */}
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
