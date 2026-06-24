export default function SkeletonCard() {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div className="skeleton" style={{ height: '18px', width: '60%' }} />
      <div className="skeleton" style={{ height: '13px', width: '90%' }} />
      <div className="skeleton" style={{ height: '13px', width: '40%' }} />
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <div className="skeleton" style={{ height: '32px', width: '80px' }} />
        <div className="skeleton" style={{ height: '32px', width: '36px' }} />
      </div>
    </div>
  );
}
