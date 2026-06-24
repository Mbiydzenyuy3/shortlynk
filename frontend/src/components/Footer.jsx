import { Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-dark)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginTop: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link2 size={18} color="var(--color-yellow)" />
        <span style={{ color: 'var(--color-text-muted-dark)', fontSize: '14px' }}>
          © {new Date().getFullYear()} Shortlynk
        </span>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {[
          { label: 'Features', to: '/#features' },
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Login', to: '/login' },
          { label: 'Register', to: '/register' },
        ].map(({ label, to }) => (
          <Link
            key={label}
            to={to}
            style={{
              color: 'var(--color-text-muted-dark)',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.target.style.color = 'var(--color-text-on-dark)')}
            onMouseLeave={e => (e.target.style.color = 'var(--color-text-muted-dark)')}
          >
            {label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
