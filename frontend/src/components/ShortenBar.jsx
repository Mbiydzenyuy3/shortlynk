import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api';

export default function ShortenBar({ onShortened }) {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) { setError('Please enter a URL.'); return; }
    if (!/^https?:\/\//i.test(url.trim())) {
      setError('URL must start with http:// or https://');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch('/api/shorten', {
        method: 'POST',
        body: JSON.stringify({ longUrl: url.trim() }),
      });
      setResult(data.shortened_URL);
      setUrl('');
      onShortened();
    } catch (err) {
      setError(err.message || 'Failed to shorten URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '24px',
        marginBottom: '32px',
      }}
    >
      <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Shorten a new link</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          className="input-field"
          style={{ flex: 1 }}
          type="url"
          placeholder="Paste your long URL here..."
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button
          className="btn btn--primary"
          type="submit"
          disabled={loading}
          style={{ height: '48px', padding: '0 24px', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Shortening...' : 'Shorten'}
        </button>
      </form>

      {error && <p style={{ color: 'var(--color-error)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

      {result && (
        <div
          style={{
            marginTop: '14px',
            backgroundColor: 'var(--color-surface)',
            borderLeft: '4px solid var(--color-yellow)',
            borderRadius: 'var(--radius-input)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 300ms ease',
          }}
        >
          <span style={{ color: 'var(--color-yellow)', fontWeight: 700 }}>{result}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn--ghost-light" onClick={handleCopy} style={{ padding: '5px 10px' }} title="Copy">
              {copied ? <Check size={15} color="green" /> : <Copy size={15} />}
            </button>
            <a href={result} target="_blank" rel="noopener noreferrer">
              <button className="btn btn--ghost-light" style={{ padding: '5px 10px' }} title="Open">
                <ExternalLink size={15} />
              </button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
