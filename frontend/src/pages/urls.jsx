import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';
import LinkCard from '../components/LinkCard';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'clicks', label: 'Most Clicks' },
  { value: 'expiring', label: 'Expiring Soon' },
];

export default function UrlListPage() {
  const navigate = useNavigate();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/shorten/my-urls');
      setUrls(data.urls || []);
    } catch {
      setUrls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchUrls();
  }, []);

  const handleDelete = async (shortCode) => {
    try {
      await apiFetch(`/api/shorten/${shortCode}`, { method: 'DELETE' });
      setUrls(prev => prev.filter(u => u.short_code !== shortCode));
    } catch {}
  };

  const sorted = [...urls].sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sort === 'clicks') return b.click_count - a.click_count;
    if (sort === 'expiring') {
      if (!a.expire_at) return 1;
      if (!b.expire_at) return -1;
      return new Date(a.expire_at) - new Date(b.expire_at);
    }
    return 0;
  });

  const filtered = sorted.filter(u =>
    u.short_url?.toLowerCase().includes(search.toLowerCase()) ||
    u.long_url?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
      <Navbar variant="light" isAuthenticated={true} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>All Links</h1>
          <a href="/dashboard">
            <button className="btn btn--primary" style={{ height: '40px', padding: '0 18px', fontSize: '14px' }}>
              + Shorten New
            </button>
          </a>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <input
            className="input-field"
            style={{ width: '280px', height: '40px' }}
            placeholder="Search links..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              {!loading && `${filtered.length} links`}
            </span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                height: '40px', padding: '0 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-input)',
                fontSize: '14px', cursor: 'pointer',
                backgroundColor: 'var(--color-white)',
              }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map(n => <SkeletonCard key={n} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message="No links found"
            subtext={search ? 'Try a different search term.' : 'Shorten your first link from the dashboard.'}
            ctaText={!search ? 'Go to Dashboard' : undefined}
            ctaHref={!search ? '/dashboard' : undefined}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filtered.map(u => (
              <LinkCard
                key={u.short_code}
                short_url={u.short_url}
                long_url={u.long_url}
                click_count={u.click_count}
                expire_at={u.expire_at}
                short_code={u.short_code}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
