import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { apiFetch } from '../api';

export default function ShortenBar({ onShortened }) {
  const [url, setUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
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
      const body = { longUrl: url.trim() };
      if (shortCode.trim()) body.shortCode = shortCode.trim();

      const data = await apiFetch('/api/shorten', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResult(data.shortened_URL);
      setUrl('');
      setShortCode('');
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
    <div style={{ marginBottom: '24px' }}>
      <form
        onSubmit={handleSubmit}
        className="responsive-flex-col"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '12px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <input
          type="text"
          placeholder="Paste URL here"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 2,
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
            minWidth: '150px',
            width: '100%'
          }}
        />
        <div className="hide-xs" style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }} />
        <input
          type="text"
          placeholder="Custom alias (optional)"
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
            minWidth: '100px',
          }}
        />
        <button
          className="btn btn--primary"
          type="submit"
          disabled={loading}
          style={{ height: '36px', padding: '0 20px', fontSize: '14px', flexShrink: 0 }}
        >
          {loading ? 'Shortening...' : 'Shorten'}
        </button>
      </form>

      {error && (
        <p style={{ color: 'var(--color-error)', fontSize: '13px', marginTop: '8px', paddingLeft: '4px' }}>
          {error}
        </p>
      )}

      {result && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '10px',
            padding: '10px 16px',
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
        >
          <a
            href={result}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-yellow)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
          >
            {result}
          </a>
          <button
            type="button"
            className="btn btn--ghost-light"
            style={{ marginLeft: 'auto', height: '30px', padding: '0 12px', fontSize: '13px' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={13} color="green" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
