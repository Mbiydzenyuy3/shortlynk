import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Pencil, Trash2, BarChart2 } from 'lucide-react';
import ClickSources from './ClickSources';
import { apiFetch } from '../api';
import type { UrlItem, ClickSourceData } from '../types';

const tdStyle: React.CSSProperties = {
  padding: '0 16px',
  verticalAlign: 'middle',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
};

interface ActionBtnProps {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}

function ActionBtn({ onClick, title, children, danger }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '28px',
        height: '28px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '6px',
        padding: 0,
        color: danger ? 'var(--color-error)' : 'var(--color-text-secondary)',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = danger ? 'var(--color-error-tint)' : 'var(--color-surface)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

interface LinkRowProps {
  url: UrlItem;
  onDelete: (shortCode: string) => Promise<void>;
  onEdit: (shortCode: string, expireAt: string | null) => Promise<void>;
}

export default function LinkRow({ url, onDelete, onEdit }: LinkRowProps) {
  const [editMode, setEditMode] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState('');
  const [copyDone, setCopyDone] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [sourcesData, setSourcesData] = useState<ClickSourceData | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourcesError, setSourcesError] = useState('');

  const createdAt =
    new Date(url.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    new Date(url.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleCopy = () => {
    navigator.clipboard.writeText(url.shortUrl);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const handleEditOpen = () => {
    setEditDate(url.expireAt ? new Date(url.expireAt).toISOString().split('T')[0] : '');
    setEditError('');
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await onEdit(url.shortCode, editDate || null);
      setEditMode(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update expiry.';
      setEditError(message);
    }
  };

  const handleToggleSources = async () => {
    if (!showSources && !sourcesData) {
      setLoadingSources(true);
      setShowSources(true);
      setSourcesError('');
      try {
        const res = await apiFetch<{ data: ClickSourceData }>(`/s/${url.shortCode}/sources`);
        setSourcesData(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics.';
        setSourcesError(message);
      } finally {
        setLoadingSources(false);
      }
    } else {
      setShowSources(!showSources);
    }
  };

  const rowBase: React.CSSProperties = {
    borderBottom: '1px solid var(--color-border)',
    transition: 'background 150ms ease',
  };

  if (editMode) {
    return (
      <tr style={{ ...rowBase, height: 'auto' }}>
        <td colSpan={5} style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-yellow)', fontWeight: 600, fontSize: '14px' }}>
              {url.shortUrl}
            </span>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Expires:</label>
            <input
              type="date"
              value={editDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDate(e.target.value)}
              className="input-field"
              style={{ width: '160px', height: '32px' }}
            />
            {editError && (
              <span style={{ color: 'var(--color-error)', fontSize: '13px' }}>{editError}</span>
            )}
            <button
              className="btn btn--primary"
              style={{ height: '32px', padding: '0 16px', fontSize: '13px' }}
              onClick={handleSave}
            >
              Save
            </button>
            <button
              className="btn btn--ghost-light"
              style={{ height: '32px', padding: '0 12px', fontSize: '13px' }}
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr
        style={{ ...rowBase, height: '56px', borderBottom: showSources ? 'none' : '1px solid var(--color-border)' }}
        onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
        onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <td style={{ ...tdStyle, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {createdAt}
        </td>
        <td style={tdStyle}>
          <span style={{ color: 'var(--color-yellow)', fontWeight: 600 }}>{url.shortUrl}</span>
        </td>
        <td
          style={{
            ...tdStyle,
            maxWidth: '320px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--color-text-secondary)',
          }}
          title={url.longUrl}
        >
          {url.longUrl}
        </td>
        <td style={{ ...tdStyle, textAlign: 'center' }}>{url.clickCount ?? 0}</td>
        <td style={{ ...tdStyle, textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
            <ActionBtn onClick={handleToggleSources} title="Analytics">
              <BarChart2 size={14} color={showSources ? 'var(--color-yellow)' : 'var(--color-text-secondary)'} />
            </ActionBtn>
            <ActionBtn onClick={handleCopy} title="Copy short link">
              {copyDone ? <Check size={14} color="var(--color-yellow)" /> : <Copy size={14} />}
            </ActionBtn>
            <a href={url.shortUrl} target="_blank" rel="noopener noreferrer">
              <ActionBtn title="Open link">
                <ExternalLink size={14} />
              </ActionBtn>
            </a>
            <ActionBtn onClick={handleEditOpen} title="Edit expiry">
              <Pencil size={14} />
            </ActionBtn>
            <ActionBtn onClick={() => onDelete(url.shortCode)} title="Delete" danger>
              <Trash2 size={14} />
            </ActionBtn>
          </div>
        </td>
      </tr>
      {showSources && (
        <tr>
          <td colSpan={5} style={{ padding: 0 }}>
            <ClickSources data={sourcesData} loading={loadingSources} error={sourcesError} />
          </td>
        </tr>
      )}
    </>
  );
}
