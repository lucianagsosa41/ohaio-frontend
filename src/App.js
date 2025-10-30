// src/App.js
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard'; // acá está la pestaña Inventario

export default function App() {
  const linkStyle = ({ isActive }) => ({
    padding: '8px 12px',
    textDecoration: 'none',
    color: isActive ? '#2563eb' : '#111',
    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
  });

  return (
    <div>
      <header style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <nav style={{ display: 'flex', gap: 12 }}>
          <NavLink to="/dashboard" style={linkStyle}>Panel</NavLink>
        </nav>
      </header>

      <main style={{ padding: 16 }}>
        <Routes>
          {/* Redirige inicio al panel */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Única pantalla principal */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<div>404</div>} />
        </Routes>
      </main>
    </div>
  );
}
