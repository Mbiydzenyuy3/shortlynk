import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';
import LinkTable from '../components/LinkTable';

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
      setUrls((prev) => prev.filter((u) => u.short_code !== shortCode));
    } catch (err) {
      if (err.message === 'URL not found.') {
        // Server confirmed the URL no longer exists — remove from local state
        setUrls((prev) => prev.filter((u) => u.short_code !== shortCode));
      }
      // Network errors / 5xx: leave row in place (server may still have the record)
    }
  };

  const handleEdit = async (shortCode, expireAt) => {
    const data = await apiFetch(`/api/shorten/${shortCode}`, {
      method: 'PATCH',
      body: JSON.stringify({ expireAt }),
    });
    setUrls((prev) =>
      prev.map((u) =>
        u.short_code === shortCode ? { ...u, expire_at: data.data?.expire_at ?? null } : u
      )
    );
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
      <Navbar variant="light" isAuthenticated={true} />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>All Links</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                height: '40px',
                padding: '0 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-input)',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-text-primary)',
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <a href="/dashboard">
              <button className="btn btn--primary" style={{ height: '40px', padding: '0 18px', fontSize: '14px' }}>
                + Shorten New
              </button>
            </a>
          </div>
        </div>

        <LinkTable
          urls={sorted}
          loading={loading}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </main>
    </div>
  );
}
