import { describe, expect, it } from 'vitest';

import { getTabsToCloseByIdle } from '../src/lib/idle';
import type { TabMeta } from '../src/lib/types';

const MIN = 60_000;
const HOUR = 60 * MIN;
const THRESHOLD = HOUR;
const NO_LIMIT = 0;

function makeTab(id: number, opts: { active?: boolean; pinned?: boolean } = {}): chrome.tabs.Tab {
  return {
    id,
    windowId: 1,
    active: opts.active ?? false,
    pinned: opts.pinned ?? false,
    index: id,
    highlighted: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    url: `https://example.com/${id}`,
    title: `Tab ${id}`,
  } as chrome.tabs.Tab;
}

function makeMeta(lastActiveAt: number): TabMeta {
  return { openedAt: lastActiveAt, lastActiveAt, url: 'https://example.com' };
}

describe('getTabsToCloseByIdle', () => {
  it('アイドル超過タブを返す', () => {
    const now = 1_000_000;
    const tabs = [makeTab(1), makeTab(2)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1),
      2: makeMeta(now - THRESHOLD + 1),
    };
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([1]);
  });

  it('ちょうど閾値のタブは閉じる', () => {
    const now = 1_000_000;
    const tabs = [makeTab(1)];
    const meta: Record<number, TabMeta> = { 1: makeMeta(now - THRESHOLD) };
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([1]);
  });

  it('アクティブタブは除外する', () => {
    const now = 1_000_000;
    const tabs = [makeTab(1, { active: true })];
    const meta: Record<number, TabMeta> = { 1: makeMeta(now - THRESHOLD - 1) };
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  it('ピン留めタブは除外する', () => {
    const now = 1_000_000;
    const tabs = [makeTab(1, { pinned: true })];
    const meta: Record<number, TabMeta> = { 1: makeMeta(now - THRESHOLD - 1) };
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  it('メタデータが存在しないタブは無視する', () => {
    const now = 1_000_000;
    const tabs = [makeTab(1)];
    const meta: Record<number, TabMeta> = {};
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  it('id が undefined のタブは無視する', () => {
    const now = 1_000_000;
    const tab = makeTab(1);
    tab.id = undefined;
    const meta: Record<number, TabMeta> = {};
    expect(getTabsToCloseByIdle([tab], meta, now, THRESHOLD, NO_LIMIT)).toEqual([]);
  });

  describe('freeLimit', () => {
    it('ピン留め以外が freeLimit 以下なら何も閉じない', () => {
      const now = 1_000_000;
      // 10 タブすべてアイドル超過だが上限 10 以下なので閉じない
      const tabs = Array.from({ length: 10 }, (_, i) => makeTab(i + 1));
      const meta = Object.fromEntries(tabs.map((t) => [t.id!, makeMeta(now - THRESHOLD - 1)]));
      expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD, 10)).toEqual([]);
    });

    it('ピン留め以外が freeLimit を 1 つ超えたら閉じる', () => {
      const now = 1_000_000;
      const tabs = Array.from({ length: 11 }, (_, i) => makeTab(i + 1));
      const meta = Object.fromEntries(tabs.map((t) => [t.id!, makeMeta(now - THRESHOLD - 1)]));
      // active でも pinned でもないタブがすべて対象
      const result = getTabsToCloseByIdle(tabs, meta, now, THRESHOLD, 10);
      expect(result).toHaveLength(11);
    });

    it('ピン留めタブは freeLimit のカウントに含まない', () => {
      const now = 1_000_000;
      // ピン留め 5 + 非ピン 10 = 合計 15、ただし非ピン 10 は limit 以下
      const pinned = Array.from({ length: 5 }, (_, i) => makeTab(i + 1, { pinned: true }));
      const unpinned = Array.from({ length: 10 }, (_, i) => makeTab(i + 6));
      const tabs = [...pinned, ...unpinned];
      const meta = Object.fromEntries(tabs.map((t) => [t.id!, makeMeta(now - THRESHOLD - 1)]));
      expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD, 10)).toEqual([]);
    });
  });
});
