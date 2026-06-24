import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';
import ShortenBar from '../components/ShortenBar';
import LinkCard from '../components/LinkCard';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const navigate = useNavigate();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUrls();
  }, []);

  // handleNewLink is passed to ShortenBar as onShortened.
  // ShortenBar calls onShortened() with no arguments after a successful shorten,
  // so we refetch the list to get the newly created link from the server.
  const handleNewLink = () => {
    fetchUrls();
  };

  const handleDelete = async (shortCode) => {
    try {
      await apiFetch(`/api/shorten/${shortCode}`, { method: 'DELETE' });
      setUrls((prev) => prev.filter((u) => u.short_code !== shortCode));
    } catch {
      // Silently ignore if delete endpoint not yet implemented
    }
  };

  const filtered = urls.filter(
    (u) =>
      u.short_url?.toLowerCase().includes(search.toLowerCase()) ||
      u.long_url?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
      <Navbar variant="light" isAuthenticated={true} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <ShortenBar onShortened={handleNewLink} />

        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
            My Links{' '}
            {!loading && (
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                ({urls.length})
              </span>
            )}
          </h2>
          <input
            className="input-field"
            style={{ width: '240px', height: '38px' }}
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {[1, 2, 3].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message="No links yet"
            subtext="Paste a URL above to create your first short link."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {filtered.map((u) => (
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
