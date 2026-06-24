import { Link2, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ variant = 'dark', isAuthenticated = false }) {
  const navigate = useNavigate();
  const isDark = variant === 'dark';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav
      className={`navbar ${isDark ? 'navbar--dark' : 'navbar--light'}`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '64px',
        backgroundColor: isDark ? 'var(--color-dark)' : 'var(--color-white)',
        borderBottom: isDark ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          color: isDark ? 'var(--color-text-on-dark)' : 'var(--color-text-primary)',
          fontWeight: 700,
          fontSize: '18px',
        }}
      >
        <Link2 size={20} color="var(--color-yellow)" />
        Shortlynk
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <button className={`btn ${isDark ? 'btn--ghost-dark' : 'btn--ghost-light'}`} onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        ) : (
          <>
            <Link to="/login">
              <button className={`btn ${isDark ? 'btn--ghost-dark' : 'btn--ghost-light'}`}>
                Login
              </button>
            </Link>
            <Link to="/register">
              <button className="btn btn--primary">Get Started</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
