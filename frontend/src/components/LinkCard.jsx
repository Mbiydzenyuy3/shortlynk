import { useState } from 'react';
import { Copy, Check, ExternalLink, Trash2, BarChart2, Calendar } from 'lucide-react';

export default function LinkCard({ short_url, long_url, click_count, expire_at, short_code, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryLabel = expire_at ? new Date(expire_at).toLocaleDateString() : 'Never';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 200ms ease, transform 200ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Short URL */}
      <p style={{ color: 'var(--color-yellow)', fontWeight: 700, fontSize: '16px', wordBreak: 'break-all' }}>
        {short_url}
      </p>

      {/* Long URL */}
      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '13px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={long_url}
      >
        {long_url}
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <BarChart2 size={13} /> {click_count} clicks
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} /> {expiryLabel}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          className="btn btn--ghost-light"
          style={{ padding: '6px 14px', fontSize: '13px' }}
          onClick={handleCopy}
          title="Copy"
        >
          {copied ? <Check size={14} color="green" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <a href={short_url} target="_blank" rel="noopener noreferrer">
          <button className="btn btn--ghost-light" style={{ padding: '6px 12px' }} title="Open link">
            <ExternalLink size={14} />
          </button>
        </a>
        <button
          className="btn btn--danger-ghost"
          style={{ padding: '6px 12px', marginLeft: 'auto' }}
          onClick={() => onDelete(short_code)}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
