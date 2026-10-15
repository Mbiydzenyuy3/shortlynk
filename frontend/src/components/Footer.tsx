import { Link2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-dark)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '12px',
        marginTop: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link2 size={20} color="var(--color-yellow)" />
        <span style={{ color: 'var(--color-text-on-dark)', fontSize: '17px', fontWeight: 700 }}>
          Shortlynk
        </span>
      </div>

      <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '14px', maxWidth: '380px', lineHeight: 1.6 }}>
        Short links with click analytics, free to use.
      </p>

      <span style={{ color: 'var(--color-text-muted-dark)', fontSize: '13px', marginTop: '4px' }}>
        © {new Date().getFullYear()} Shortlynk
      </span>
    </footer>
  );
}
