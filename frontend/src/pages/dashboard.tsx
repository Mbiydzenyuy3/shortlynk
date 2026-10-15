import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';
import ShortenBar from '../components/ShortenBar';
import LinkTable from '../components/LinkTable';
import Seo from '../components/Seo';
import type { UrlItem } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ urls: UrlItem[] }>('/api/shorten/my-urls');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (shortCode: string): Promise<void> => {
    try {
      await apiFetch(`/api/shorten/${shortCode}`, { method: 'DELETE' });
      setUrls((prev) => prev.filter((u) => u.short_code !== shortCode));
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'URL not found.') {
        setUrls((prev) => prev.filter((u) => u.short_code !== shortCode));
      }
    }
  };

  const handleEdit = async (shortCode: string, expireAt: string | null): Promise<void> => {
    const data = await apiFetch<{ data?: { expire_at: string | null } }>(`/api/shorten/${shortCode}`, {
      method: 'PATCH',
      body: JSON.stringify({ expireAt }),
    });
    setUrls((prev) =>
      prev.map((u) =>
        u.short_code === shortCode ? { ...u, expire_at: data.data?.expire_at ?? null } : u
      )
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
      <Seo title="Dashboard — Shortlynk" description="Manage your short links and view click analytics." noindex />
      <Navbar variant="light" isAuthenticated={true} />
      <main className="responsive-pad" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <ShortenBar onShortened={fetchUrls} />
        <LinkTable
          urls={urls}
          loading={loading}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </main>
    </div>
  );
}
