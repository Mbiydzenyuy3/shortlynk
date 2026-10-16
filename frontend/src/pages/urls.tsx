import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';
import LinkTable from '../components/LinkTable';
import Seo from '../components/Seo';
import type { UrlItem } from '../types';

interface SortOption {
  value: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'clicks', label: 'Most Clicks' },
  { value: 'expiring', label: 'Expiring Soon' },
];

export default function UrlListPage() {
  const navigate = useNavigate();
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

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
      setUrls((prev) => prev.filter((u) => u.shortCode !== shortCode));
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'URL not found.') {
        setUrls((prev) => prev.filter((u) => u.shortCode !== shortCode));
      }
    }
  };

  const handleEdit = async (shortCode: string, expireAt: string | null): Promise<void> => {
    const data = await apiFetch<{ data?: { expireAt: string | null } }>(`/api/shorten/${shortCode}`, {
      method: 'PATCH',
      body: JSON.stringify({ expireAt }),
    });
    setUrls((prev) =>
      prev.map((u) =>
        u.shortCode === shortCode ? { ...u, expireAt: data.data?.expireAt ?? null } : u
      )
    );
  };

  const sorted = [...urls].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === 'clicks') return b.clickCount - a.clickCount;
    if (sort === 'expiring') {
      if (!a.expireAt) return 1;
      if (!b.expireAt) return -1;
      return new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime();
    }
    return 0;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
      <Seo title="Your Links — Shortlynk" description="Every short link you have created." noindex />
      <Navbar variant="light" isAuthenticated={true} />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>All Links</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={sort}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value)}
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
