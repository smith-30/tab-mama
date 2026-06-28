import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { IDLE_CLOSE_DEFAULT_MIN, TAB_FREE_LIMIT } from '../config';
import {
  getEnabled,
  getFreeLimit,
  getIdleCloseMin,
  setEnabled,
  setFreeLimit,
  setIdleCloseMin,
} from '../storage/tabMeta';
import { NumberTicker } from './components/NumberTicker';
import { PowerButton } from './components/PowerButton';

const STATIC_FEATURES = [
  { icon: '🔗', label: '同一 URL 10分超 → 重複クローズ' },
  { icon: '🗂', label: '5分ごとにドメイン順で整列' },
] as const;

const MIN_LIMIT = 1;
const MAX_LIMIT = 99;
const MIN_IDLE_MIN = 10;
const MAX_IDLE_MIN = 480;
const IDLE_STEP = 10;

export default function App() {
  const [enabled, setEnabledState] = useState<boolean | null>(null);
  const [tabCount, setTabCount] = useState<number | null>(null);
  const [freeLimit, setFreeLimitState] = useState<number>(TAB_FREE_LIMIT);
  const [idleMin, setIdleMinState] = useState<number>(IDLE_CLOSE_DEFAULT_MIN);

  useEffect(() => {
    getEnabled().then(setEnabledState);
    getFreeLimit().then(setFreeLimitState);
    getIdleCloseMin().then(setIdleMinState);
    chrome.tabs.query({}).then((tabs) => setTabCount(tabs.length));
  }, []);

  const toggle = useCallback(async () => {
    if (enabled == null) return;
    const next = !enabled;
    await setEnabled(next);
    setEnabledState(next);
  }, [enabled]);

  const changeLimit = useCallback(
    async (delta: number) => {
      const next = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, freeLimit + delta));
      await setFreeLimit(next);
      setFreeLimitState(next);
    },
    [freeLimit],
  );

  const changeIdleMin = useCallback(
    async (delta: number) => {
      const next = Math.min(MAX_IDLE_MIN, Math.max(MIN_IDLE_MIN, idleMin + delta));
      await setIdleCloseMin(next);
      setIdleMinState(next);
    },
    [idleMin],
  );

  return (
    <div className="min-w-[280px] bg-zinc-50 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      {/* Header */}
      <h1 className="mb-4 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 bg-clip-text text-lg font-bold text-transparent dark:from-violet-400 dark:via-blue-400 dark:to-cyan-400">
        tab-mama
      </h1>

      {/* Power + tab count */}
      <div className="mb-4 flex items-center gap-4 rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <PowerButton enabled={enabled ?? false} loading={enabled == null} onToggle={toggle} />
        <div className="flex flex-1 flex-col items-center">
          <p className="mb-0.5 text-xs font-medium tracking-widest text-zinc-700 uppercase dark:text-zinc-400">
            起動中のタブ
          </p>
          <p className="text-4xl font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
            {tabCount != null ? <NumberTicker value={tabCount} /> : '—'}
          </p>
        </div>
      </div>

      {/* Feature list */}
      <div className="mb-3">
        {[{ icon: '⏱', label: `${idleMin}分 アイドル → 自動クローズ` }, ...STATIC_FEATURES].map(
          ({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-2.5 py-0.5">
              <span className="text-sm">{icon}</span>
              <span className="text-[11px] dark:text-zinc-400">{label}</span>
            </div>
          ),
        )}
      </div>

      {/* Settings */}
      <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white/60 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60">
        <SettingRow label="タブ上限(ピン留め除く)">
          <Stepper
            value={freeLimit}
            unit=""
            onDec={() => changeLimit(-1)}
            onInc={() => changeLimit(1)}
            disableDec={freeLimit <= MIN_LIMIT}
            disableInc={freeLimit >= MAX_LIMIT}
          />
        </SettingRow>
        <SettingRow label="アイドル閾値">
          <Stepper
            value={idleMin}
            unit="分"
            onDec={() => changeIdleMin(-IDLE_STEP)}
            onInc={() => changeIdleMin(IDLE_STEP)}
            disableDec={idleMin <= MIN_IDLE_MIN}
            disableInc={idleMin >= MAX_IDLE_MIN}
          />
        </SettingRow>
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <div className="flex items-center justify-between px-2 py-2.5">
      <span className="text-[11px] dark:text-zinc-400">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface StepperProps {
  value: number;
  unit: string;
  onDec: () => void;
  onInc: () => void;
  disableDec: boolean;
  disableInc: boolean;
}

function Stepper({ value, unit, onDec, onInc, disableDec, disableInc }: StepperProps) {
  return (
    <div className="flex items-center gap-1">
      <StepBtn onClick={onDec} disabled={disableDec}>
        −
      </StepBtn>
      <span className="min-w-[2.5rem] text-center text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
        {value}
        {unit}
      </span>
      <StepBtn onClick={onInc} disabled={disableInc}>
        ＋
      </StepBtn>
    </div>
  );
}

function StepBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: ComponentChildren;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 bg-zinc-100 text-sm text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
    >
      {children}
    </button>
  );
}
