import { useState, useEffect } from 'react';
import LinkRow from './LinkRow';
import SkeletonRow from './SkeletonRow';
import EmptyState from './EmptyState';

const PAGE_SIZE = 20;

function pageButtonStyle(active) {
  return {
    minWidth: '32px',
    height: '32px',
    padding: '0 8px',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    background: active ? 'var(--color-yellow)' : 'transparent',
    color: active ? 'var(--color-white)' : 'var(--color-text-primary)',
    fontWeight: active ? 600 : 400,
    fontSize: '13px',
    cursor: active ? 'default' : 'pointer',
  };
}

const thStyle = {
  padding: '0 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
};

export default function LinkTable({ urls, loading, onDelete, onEdit }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => { setCurrentPage(1); }, [urls.length]);

  const filtered = urls.filter(
    (u) =>
      u.short_url?.toLowerCase().includes(search.toLowerCase()) ||
      u.long_url?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div
      style={{
        background: 'var(--color-white)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          All links{' '}
          <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>
            ({filtered.length})
          </span>
        </span>
        <input
          className="input-field"
          style={{ width: '240px', height: '36px' }}
          placeholder="Search or filter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-responsive-wrapper">
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr style={{ height: '40px', backgroundColor: 'var(--color-surface)' }}>
            <th style={{ ...thStyle, width: '120px' }}>Created</th>
            <th style={{ ...thStyle, width: '200px' }}>Short link</th>
            <th style={{ ...thStyle }}>Original link</th>
            <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Clicks</th>
            <th style={{ ...thStyle, width: '140px' }}></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [1, 2, 3].map((n) => <SkeletonRow key={n} />)
          ) : paged.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 0 }}>
                {urls.length === 0 ? (
                  <EmptyState
                    message="No links yet"
                    subtext="Paste a URL above to create your first link."
                  />
                ) : (
                  <p
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                    }}
                  >
                    No links match your search.
                  </p>
                )}
              </td>
            </tr>
          ) : (
            paged.map((u) => (
              <LinkRow key={u.short_code} url={u} onDelete={onDelete} onEdit={onEdit} />
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '4px',
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={pageButtonStyle(false)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setCurrentPage(p)} style={pageButtonStyle(p === currentPage)}>
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={pageButtonStyle(false)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
