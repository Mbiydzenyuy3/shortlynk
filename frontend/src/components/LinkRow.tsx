import { useState } from 'react';
import { Copy, Check, ExternalLink, Pencil, Trash2, BarChart2 } from 'lucide-react';
import ClickSources from './ClickSources';
import { apiFetch } from '../api';

const tdStyle = {
  padding: '0 16px',
  verticalAlign: 'middle',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
};

function ActionBtn({ onClick, title, children, danger }) {
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
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? 'var(--color-error-tint)' : 'var(--color-surface)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export default function LinkRow({ url, onDelete, onEdit }) {
  const [editMode, setEditMode] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState('');
  const [copyDone, setCopyDone] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [sourcesData, setSourcesData] = useState(null);
  const [loadingSources, setLoadingSources] = useState(false);

  const createdAt =
    new Date(url.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    new Date(url.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleCopy = () => {
    navigator.clipboard.writeText(url.short_url);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const handleEditOpen = () => {
    setEditDate(url.expire_at ? new Date(url.expire_at).toISOString().split('T')[0] : '');
    setEditError('');
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await onEdit(url.short_code, editDate || null);
      setEditMode(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update expiry.');
    }
  };

  const handleToggleSources = async () => {
    if (!showSources && !sourcesData) {
      setLoadingSources(true);
      setShowSources(true);
      try {
        const res = await apiFetch(`/s/${url.short_code}/sources`);
        setSourcesData(res.data);
      } catch (err) {
        // Failed to load sources
      } finally {
        setLoadingSources(false);
      }
    } else {
      setShowSources(!showSources);
    }
  };

  const rowBase = {
    borderBottom: '1px solid var(--color-border)',
    transition: 'background 150ms ease',
  };

  if (editMode) {
    return (
      <tr style={{ ...rowBase, height: 'auto' }}>
        <td colSpan={5} style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-yellow)', fontWeight: 600, fontSize: '14px' }}>
              {url.short_url}
            </span>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Expires:</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
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
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <td style={{ ...tdStyle, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {createdAt}
        </td>
        <td style={tdStyle}>
          <span style={{ color: 'var(--color-yellow)', fontWeight: 600 }}>{url.short_url}</span>
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
          title={url.long_url}
        >
          {url.long_url}
        </td>
        <td style={{ ...tdStyle, textAlign: 'center' }}>{url.click_count ?? 0}</td>
        <td style={{ ...tdStyle, textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
            <ActionBtn onClick={handleToggleSources} title="Analytics">
              <BarChart2 size={14} color={showSources ? 'var(--color-yellow)' : 'var(--color-text-secondary)'} />
            </ActionBtn>
            <ActionBtn onClick={handleCopy} title="Copy short link">
              {copyDone ? <Check size={14} color="var(--color-yellow)" /> : <Copy size={14} />}
            </ActionBtn>
            <a href={url.short_url} target="_blank" rel="noopener noreferrer">
              <ActionBtn title="Open link">
                <ExternalLink size={14} />
              </ActionBtn>
            </a>
            <ActionBtn onClick={handleEditOpen} title="Edit expiry">
              <Pencil size={14} />
            </ActionBtn>
            <ActionBtn onClick={() => onDelete(url.short_code)} title="Delete" danger>
              <Trash2 size={14} />
            </ActionBtn>
          </div>
        </td>
      </tr>
      {showSources && (
        <tr>
          <td colSpan={5} style={{ padding: 0 }}>
            <ClickSources data={sourcesData} loading={loadingSources} />
          </td>
        </tr>
      )}
    </>
  );
}
