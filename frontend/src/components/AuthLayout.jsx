import { Link2 } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle, toggleText, toggleHref }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left dark panel */}
      <div
        style={{
          flex: '0 0 45%',
          backgroundColor: 'var(--color-dark)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px 48px',
          gap: '48px',
        }}
        className="auth-panel-left"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link2 size={28} color="var(--color-yellow)" />
          <span style={{ color: 'var(--color-text-on-dark)', fontSize: '24px', fontWeight: 700 }}>
            Shortlynk
          </span>
        </div>

        <div>
          <p style={{ color: 'var(--color-text-on-dark)', fontSize: '28px', fontWeight: 600, lineHeight: 1.3, marginBottom: '16px' }}>
            The smart way to share links
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px' }}>
          {[
            { number: '10M+', label: 'Links Created' },
            { number: '99.9%', label: 'Uptime' },
          ].map(({ number, label }) => (
            <div key={label}>
              <p style={{ color: 'var(--color-text-on-dark)', fontSize: '24px', fontWeight: 700 }}>{number}</p>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '13px' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right white panel */}
      <div
        style={{
          flex: 1,
          backgroundColor: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
        className="responsive-pad"
      >
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card-hover)',
            padding: '40px',
            width: '100%',
            maxWidth: '440px',
          }}
          className="auth-card-pad"
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              <Link2 size={20} color="var(--color-yellow)" />
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Shortlynk</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>{title}</h1>
            {subtitle && <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{subtitle}</p>}
          </div>

          {children}

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {toggleText}{' '}
            <a href={toggleHref} style={{ color: 'var(--color-yellow)', fontWeight: 500, textDecoration: 'none' }}>
              {toggleHref === '/register' ? 'Register →' : 'Login →'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
