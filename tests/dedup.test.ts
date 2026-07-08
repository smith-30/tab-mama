import { describe, expect, it } from 'vitest';

import { getTabsToCloseByDedup } from '../src/lib/dedup';
import type { TabMeta } from '../src/lib/types';

const MIN = 60_000;
const THRESHOLD = 10 * MIN;
const NO_LIMIT = 0;

function makeTab(
  id: number,
  url: string,
  opts: { active?: boolean; pinned?: boolean; audible?: boolean } = {},
): chrome.tabs.Tab {
  return {
    id,
    windowId: 1,
    active: opts.active ?? false,
    pinned: opts.pinned ?? false,
    audible: opts.audible ?? false,
    index: id,
    highlighted: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    url,
    title: `Tab ${id}`,
  } as chrome.tabs.Tab;
}

function makeMeta(openedAt: number, url: string): TabMeta {
  return { openedAt, lastActiveAt: openedAt, url };
}

describe('getTabsToCloseByDedup', () => {
  it('重複 URL で古いタブ(10 分超)を閉じる', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    const tabs = [makeTab(1, url), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([1]);
  });

  it('古いタブが 10 分未満なら閉じない', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    const tabs = [makeTab(1, url), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD + 1, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  it('ちょうど閾値の場合は閉じる', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    const tabs = [makeTab(1, url), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([1]);
  });

  it('重複なしの場合は何も返さない', () => {
    const now = 1_000_000;
    const tabs = [makeTab(1, 'https://a.com'), makeTab(2, 'https://b.com')];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, 'https://a.com'),
      2: makeMeta(now - THRESHOLD - 1, 'https://b.com'),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  it('アクティブタブは除外する', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    const tabs = [makeTab(1, url, { active: true }), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  it('ピン留めタブは除外する', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    const tabs = [makeTab(1, url, { pinned: true }), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  it('音声再生中のタブは重複していても閉じない', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    const tabs = [makeTab(1, url, { audible: true }), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  it('音声再生中でない古い重複タブは従来どおり閉じる', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    // 最新(3)が audible でも、古い非 audible(1, 2)は閉じる
    const tabs = [makeTab(1, url), makeTab(2, url), makeTab(3, url, { audible: true })];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 3, url),
      2: makeMeta(now - THRESHOLD - 2, url),
      3: makeMeta(now, url),
    };
    const result = getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT);
    expect(result.toSorted()).toEqual([1, 2]);
  });

  it('3 つ重複があれば最新 1 つを残して他は閉じる', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    const tabs = [makeTab(1, url), makeTab(2, url), makeTab(3, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 3, url),
      2: makeMeta(now - THRESHOLD - 2, url),
      3: makeMeta(now, url),
    };
    const result = getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT);
    expect(result.toSorted()).toEqual([1, 2]);
  });

  it('メタデータにないタブは無視する', () => {
    const now = 1_000_000;
    const url = 'https://example.com/page';
    const tabs = [makeTab(1, url), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  describe('freeLimit', () => {
    it('ピン留め以外が freeLimit 以下なら重複でも閉じない', () => {
      const now = 1_000_000;
      const url = 'https://example.com/page';
      // 重複 2 タブ(合計非ピン 2)、limit=10 → 閉じない
      const tabs = [makeTab(1, url), makeTab(2, url)];
      const meta: Record<number, TabMeta> = {
        1: makeMeta(now - THRESHOLD - 1, url),
        2: makeMeta(now, url),
      };
      expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, 10)).toEqual([]);
    });

    it('ピン留め以外が freeLimit を超えたら重複を閉じる', () => {
      const now = 1_000_000;
      const url = 'https://example.com/page';
      // 非ピン 11 タブ(うち 2 つが同じ URL)
      const extra = Array.from({ length: 9 }, (_, i) => makeTab(i + 3, `https://extra${i}.com`));
      const tabs = [makeTab(1, url), makeTab(2, url), ...extra];
      const meta: Record<number, TabMeta> = {
        1: makeMeta(now - THRESHOLD - 1, url),
        2: makeMeta(now, url),
        ...Object.fromEntries(
          extra.map((t) => [t.id!, makeMeta(now, `https://extra${t.id! - 3}.com`)]),
        ),
      };
      expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, 10)).toEqual([1]);
    });

    it('ピン留めタブは freeLimit のカウントに含まない', () => {
      const now = 1_000_000;
      const url = 'https://example.com/page';
      // ピン留め 5 + 非ピン 2(重複)= 合計 7、非ピン 2 ≤ limit=10
      const pinned = Array.from({ length: 5 }, (_, i) => makeTab(i + 3, url, { pinned: true }));
      const tabs = [makeTab(1, url), makeTab(2, url), ...pinned];
      const meta: Record<number, TabMeta> = {
        1: makeMeta(now - THRESHOLD - 1, url),
        2: makeMeta(now, url),
        ...Object.fromEntries(pinned.map((t) => [t.id!, makeMeta(now - THRESHOLD - 1, url)])),
      };
      expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD, 10)).toEqual([]);
    });
  });
});
