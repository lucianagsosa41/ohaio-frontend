import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div>
      <header style={{padding: '12px', borderBottom: '1px solid #eee'}}>
        <nav style={{display:'flex', gap:12}}>
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/stock">Stock</NavLink>
          {/* Botón que navega por código */}
          <button onClick={() => navigate('/stock')}>Ir a Stock</button>
        </nav>
      </header>

      <main style={{padding: '16px'}}>
        <Outlet /> {/* Aquí se renderizan las páginas hijas */}
      </main>
    </div>
  );
}
