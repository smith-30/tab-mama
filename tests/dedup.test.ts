import { describe, it, expect } from "vitest";
import { getTabsToCloseByDedup } from "../src/lib/dedup";
import type { TabMeta } from "../src/lib/types";

const MIN = 60_000;
const THRESHOLD = 10 * MIN;

function makeTab(
  id: number,
  url: string,
  opts: { active?: boolean; pinned?: boolean } = {}
): chrome.tabs.Tab {
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
    url,
    title: `Tab ${id}`,
  } as chrome.tabs.Tab;
}

function makeMeta(openedAt: number, url: string): TabMeta {
  return { openedAt, lastActiveAt: openedAt, url };
}

describe("getTabsToCloseByDedup", () => {
  it("重複 URL で古いタブ(10 分超)を閉じる", () => {
    const now = 1_000_000;
    const url = "https://example.com/page";
    const tabs = [makeTab(1, url), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, url), // 古い
      2: makeMeta(now, url), // 新しい → 残す
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD)).toEqual([1]);
  });

  it("古いタブが 10 分未満なら閉じない", () => {
    const now = 1_000_000;
    const url = "https://example.com/page";
    const tabs = [makeTab(1, url), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD + 1, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD)).toEqual([]);
  });

  it("ちょうど閾値の場合は閉じる", () => {
    const now = 1_000_000;
    const url = "https://example.com/page";
    const tabs = [makeTab(1, url), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD)).toEqual([1]);
  });

  it("重複なしの場合は何も返さない", () => {
    const now = 1_000_000;
    const tabs = [
      makeTab(1, "https://a.com"),
      makeTab(2, "https://b.com"),
    ];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, "https://a.com"),
      2: makeMeta(now - THRESHOLD - 1, "https://b.com"),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD)).toEqual([]);
  });

  it("アクティブタブは除外する", () => {
    const now = 1_000_000;
    const url = "https://example.com/page";
    const tabs = [makeTab(1, url, { active: true }), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, url),
      2: makeMeta(now, url),
    };
    // tab2 は新しいので残す、tab1 はアクティブなので除外
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD)).toEqual([]);
  });

  it("ピン留めタブは除外する", () => {
    const now = 1_000_000;
    const url = "https://example.com/page";
    const tabs = [makeTab(1, url, { pinned: true }), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1, url),
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD)).toEqual([]);
  });

  it("3 つ重複があれば最新 1 つを残して他は閉じる", () => {
    const now = 1_000_000;
    const url = "https://example.com/page";
    const tabs = [makeTab(1, url), makeTab(2, url), makeTab(3, url)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 3, url),
      2: makeMeta(now - THRESHOLD - 2, url),
      3: makeMeta(now, url), // 最新 → 残す
    };
    const result = getTabsToCloseByDedup(tabs, meta, now, THRESHOLD);
    expect(result.sort()).toEqual([1, 2]);
  });

  it("メタデータにないタブは無視する", () => {
    const now = 1_000_000;
    const url = "https://example.com/page";
    const tabs = [makeTab(1, url), makeTab(2, url)];
    const meta: Record<number, TabMeta> = {
      2: makeMeta(now, url),
    };
    expect(getTabsToCloseByDedup(tabs, meta, now, THRESHOLD)).toEqual([]);
  });
});
