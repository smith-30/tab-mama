import { useCallback, useEffect, useState } from 'preact/hooks';

import { getEnabled, setEnabled } from '../storage/tabMeta';
import { NumberTicker } from './components/NumberTicker';
import { PowerButton } from './components/PowerButton';

const FEATURES = [
  { icon: '⏱', label: '1h アイドル → 自動クローズ' },
  { icon: '🔗', label: '同 URL 10分超 → 重複クローズ' },
  { icon: '🗂', label: '5分ごとにドメイン順で整列' },
] as const;

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

  return (
    <div className="min-w-[280px] bg-zinc-950 p-4 text-white">
      {/* Header */}
      <h1 className="mb-4 bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent">
        tab-mama
      </h1>

      {/* Power + tab count */}
      <div className="mb-4 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <PowerButton enabled={enabled ?? false} loading={enabled == null} onToggle={toggle} />
        <div>
          <p className="text-[11px] text-zinc-500">管理中のタブ</p>
          <p className="text-3xl font-bold tabular-nums text-zinc-100">
            {tabCount != null ? <NumberTicker value={tabCount} /> : '—'}
          </p>
        </div>
      </div>

      {/* Feature list */}
      <div className="space-y-1.5">
        {FEATURES.map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-lg bg-zinc-900/40 px-2.5 py-1.5"
          >
            <span className="text-sm">{icon}</span>
            <span className="text-[11px] text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
