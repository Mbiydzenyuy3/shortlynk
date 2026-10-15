import { Link2 } from 'lucide-react';

export default function EmptyState({ message, subtext, ctaText, ctaHref }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '64px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-yellow-tint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link2 size={32} color="var(--color-yellow)" />
      </div>
      <div>
        <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>{message}</p>
        {subtext && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{subtext}</p>
        )}
      </div>
      {ctaText && ctaHref && (
        <a href={ctaHref}>
          <button className="btn btn--primary" style={{ marginTop: '8px' }}>
            {ctaText}
          </button>
        </a>
      )}
    </div>
  );
}
