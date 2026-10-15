import { useState } from 'react';
import type { ClickSourceData, SourceItem } from '../types';

interface SourceBarProps {
  name: string;
  count: number;
  maxCount: number;
}

function SourceBar({ name, count, maxCount }: SourceBarProps) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <span style={{
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--color-text-primary)',
        minWidth: '100px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
      <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-surface)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: 'var(--color-yellow)',
          borderRadius: '4px',
          transition: 'width 300ms ease',
        }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '30px', textAlign: 'right' }}>
        {count}
      </span>
    </div>
  );
}

interface SourceSectionProps {
  title: string | undefined;
  items: SourceItem[];
}

function SourceSection({ title, items }: SourceSectionProps) {
  if (!items || items.length === 0) {
    return (
      <div>
        <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
          {title}
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No data yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...items.map(i => i.count));

  return (
    <div>
      <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
        {title}
      </h4>
      {items.map(item => (
        <SourceBar key={item.name} name={item.name} count={item.count} maxCount={maxCount} />
      ))}
    </div>
  );
}

interface ClickSourcesProps {
  data: ClickSourceData | null;
  loading: boolean;
}

type TabKey = keyof ClickSourceData;

export default function ClickSources({ data, loading }: ClickSourcesProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('referrers');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'referrers', label: 'Referrers' },
    { key: 'countries', label: 'Countries' },
    { key: 'devices', label: 'Devices' },
    { key: 'browsers', label: 'Browsers' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>No analytics available.</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px 20px',
      borderTop: '1px solid var(--color-border)',
      backgroundColor: 'var(--color-surface)',
      animation: 'fadeIn 200ms ease',
    }}>
      {/* Tab bar */}
      <div className="responsive-flex-wrap" style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: activeTab === tab.key ? 600 : 400,
              border: '1px solid',
              borderColor: activeTab === tab.key ? 'var(--color-yellow)' : 'var(--color-border)',
              borderRadius: '6px',
              backgroundColor: activeTab === tab.key ? 'var(--color-yellow)' : 'transparent',
              color: activeTab === tab.key ? 'var(--color-white)' : 'var(--color-text-primary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active section */}
      <SourceSection title={tabs.find(t => t.key === activeTab)?.label} items={data[activeTab]} />
    </div>
  );
}
