import { useState } from 'react';
import { Copy, Check, ExternalLink, ChevronRight } from 'lucide-react';
import { apiFetch } from '../api';

export default function HeroInput() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!url.trim()) { setError('Please enter a URL.'); return; }
    if (!/^https?:\/\//i.test(url.trim())) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/api/shorten/guest', {
        method: 'POST',
        body: JSON.stringify({ longUrl: url.trim() }),
      });
      setResult(data.shortened_URL);
      setUrl('');
    } catch {
      setError('Something went wrong. Please try again.');
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
    <div style={{ width: '100%', maxWidth: '640px' }}>
      <form onSubmit={handleShorten} className="responsive-flex-col" style={{ display: 'flex', gap: '10px' }}>
        <input
          className="input-field"
          style={{ flex: 1, height: '56px', backgroundColor: 'rgba(255,255,255,0.95)' }}
          type="text"
          placeholder="Paste your long URL here..."
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button
          className="btn btn--primary"
          type="submit"
          disabled={loading}
          style={{ height: '56px', padding: '0 28px', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {loading ? 'Shortening...' : 'Shorten'}
        </button>
      </form>

      {error && (
        <p style={{ color: '#FCA5A5', fontSize: '13px', marginTop: '8px' }}>{error}</p>
      )}

      {result && (
        <div
          style={{
            marginTop: '16px',
            backgroundColor: 'var(--color-white)',
            borderLeft: '4px solid var(--color-yellow)',
            borderRadius: 'var(--radius-input)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 300ms ease',
          }}
        >
          <span style={{ color: 'var(--color-yellow)', fontWeight: 700, fontSize: '16px' }}>
            {result}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn--ghost-light"
              onClick={handleCopy}
              style={{ padding: '6px 12px' }}
              title="Copy"
            >
              {copied ? <Check size={16} color="green" /> : <Copy size={16} />}
            </button>
            <a href={result} target="_blank" rel="noopener noreferrer">
              <button className="btn btn--ghost-light" style={{ padding: '6px 12px' }} title="Open">
                <ExternalLink size={16} />
              </button>
            </a>
          </div>
        </div>
      )}

      {result && (
        <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Want to track clicks &amp; manage all your links?{' '}
          <a href="/register" style={{ color: 'var(--color-yellow)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Sign up free <ChevronRight size={14} />
          </a>
        </p>
      )}
    </div>
  );
}
