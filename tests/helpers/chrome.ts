import { vi } from 'vitest';

interface ChromeMockOptions {
  store?: Record<string, unknown>;
  tabCount?: number;
  pinnedCount?: number;
  // chrome.i18n.getMessage の戻り値。省略時は空文字(dev 相当 → i18n.ts が日本語へフォールバック)。
  i18nMessage?: (key: string, subs?: string[]) => string;
}

// tests から chrome.* を最小限モックする。storage はインメモリ。
export function installChromeMock(opts: ChromeMockOptions = {}) {
  const store: Record<string, unknown> = { ...opts.store };
  const tabCount = opts.tabCount ?? 0;
  const pinnedCount = opts.pinnedCount ?? 0;
  const getMessage = opts.i18nMessage ?? (() => '');

  const chromeMock = {
    storage: {
      local: {
        get: vi.fn<(keys: string | string[] | null) => Promise<Record<string, unknown>>>(
          async (keys) => {
            if (keys == null) return { ...store };
            const arr = Array.isArray(keys) ? keys : [keys];
            const res: Record<string, unknown> = {};
            for (const k of arr) if (k in store) res[k] = store[k];
            return res;
          },
        ),
        set: vi.fn<(obj: Record<string, unknown>) => Promise<void>>(async (obj) => {
          Object.assign(store, obj);
        }),
        remove: vi.fn<(key: string) => Promise<void>>(async (key) => {
          delete store[key];
        }),
      },
    },
    tabs: {
      query: vi.fn<() => Promise<{ id: number; pinned: boolean }[]>>(async () =>
        Array.from({ length: tabCount }, (_, i) => ({ id: i + 1, pinned: i < pinnedCount })),
      ),
    },
    i18n: { getMessage: vi.fn<(key: string, subs?: string[]) => string>(getMessage) },
  };

  vi.stubGlobal('chrome', chromeMock);
  return { store, chrome: chromeMock };
}
