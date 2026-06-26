import { useState, useEffect, useRef } from 'react';
import { Link2, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function getUserFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { username: payload.username || payload.email || 'Account' };
  } catch {
    return null;
  }
}

export default function Navbar({ variant = 'dark', isAuthenticated = false }) {
  const navigate = useNavigate();
  const isDark = variant === 'dark';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = isAuthenticated ? getUserFromToken() : null;
  const username = user?.username || 'Account';
  const initials = username.slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setDropdownOpen(false);
    navigate('/');
  };

  const dropdownItem = {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '10px 16px',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500,
    color: 'var(--color-text-primary)',
    textAlign: 'left',
  };

  return (
    <nav
      className={`navbar responsive-pad ${isDark ? 'navbar--dark' : 'navbar--light'}`}
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
          display: 'flex', alignItems: 'center', gap: '8px',
          textDecoration: 'none',
          color: isDark ? 'var(--color-text-on-dark)' : 'var(--color-text-primary)',
          fontWeight: 700, fontSize: '18px',
        }}
      >
        <Link2 size={20} color="var(--color-yellow)" />
        Shortlynk
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <button className={`btn ${isDark ? 'btn--ghost-dark' : 'btn--ghost-light'}`}>
                <LayoutDashboard size={16} />
                Dashboard
              </button>
            </Link>

            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'var(--color-surface)',
                  border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--color-border)',
                  borderRadius: '999px',
                  padding: '5px 12px 5px 5px',
                  cursor: 'pointer',
                  color: isDark ? 'var(--color-text-on-dark)' : 'var(--color-text-primary)',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: 'var(--color-yellow)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, flexShrink: 0,
                }}>
                  {initials}
                </div>
                <span className="hide-xs" style={{ fontSize: '13px', fontWeight: 500, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {username}
                </span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-card-hover)',
                  minWidth: '160px', zIndex: 100, overflow: 'hidden',
                }}>
                  <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Signed in as</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, margin: '2px 0 0', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</p>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/dashboard'); }}
                    style={dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LayoutDashboard size={14} color="var(--color-text-secondary)" />
                    Dashboard
                  </button>
                  <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
                  <button
                    onClick={handleLogout}
                    style={{ ...dropdownItem, color: 'var(--color-error)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button className={`btn ${isDark ? 'btn--ghost-dark' : 'btn--ghost-light'}`}>
                Login
              </button>
            </Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button className="btn btn--primary">Get Started</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
