import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { getEnabled, setEnabled } from '../storage/tabMeta';

export default function App() {
  const [enabled, setEnabledState] = useState<boolean | null>(null);
  const [tabCount, setTabCount] = useState<number | null>(null);

  useEffect(() => {
    getEnabled().then(setEnabledState);
    chrome.tabs.query({}).then((tabs) => setTabCount(tabs.length));
  }, []);

  const toggle = useCallback(async () => {
    if (enabled == null) return;
    const next = !enabled;
    await setEnabled(next);
    setEnabledState(next);
  }, [enabled]);

  const toggleStyle = useMemo(
    () => ({
      ...styles.toggle,
      background: enabled ? '#22c55e' : '#6b7280',
    }),
    [enabled],
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>tab-mama</h1>

      <div style={styles.row}>
        <span style={styles.label}>管理中タブ数</span>
        <span style={styles.value}>{tabCount ?? '…'}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>自動管理</span>
        <button
          onClick={toggle}
          style={toggleStyle}
          disabled={enabled == null}
          aria-pressed={enabled ?? false}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={styles.hints}>
        <p>1 時間アイドル → 自動クローズ</p>
        <p>同 URL の古いタブ(10 分超) → 自動クローズ</p>
        <p>5 分ごとにドメイン順で整列</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1e293b',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '14px',
    color: '#475569',
  },
  value: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e293b',
  },
  toggle: {
    border: 'none',
    borderRadius: '6px',
    padding: '4px 16px',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background 0.2s',
  },
  hints: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    fontSize: '11px',
    color: '#94a3b8',
  },
} as const;
