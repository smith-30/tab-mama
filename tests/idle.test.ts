import { describe, it, expect } from "vitest";
import { getTabsToCloseByIdle } from "../src/lib/idle";
import type { TabMeta } from "../src/lib/types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const THRESHOLD = HOUR;

function makeTab(
  id: number,
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
    url: `https://example.com/${id}`,
    title: `Tab ${id}`,
  } as chrome.tabs.Tab;
}

function makeMeta(lastActiveAt: number): TabMeta {
  return { openedAt: lastActiveAt, lastActiveAt, url: "https://example.com" };
}

describe("getTabsToCloseByIdle", () => {
  it("アイドル超過タブを返す", () => {
    const now = 1_000_000;
    const tabs = [makeTab(1), makeTab(2)];
    const meta: Record<number, TabMeta> = {
      1: makeMeta(now - THRESHOLD - 1),
      2: makeMeta(now - THRESHOLD + 1),
    };
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD)).toEqual([1]);
  });

  it("ちょうど閾値のタブは閉じる", () => {
    const now = 1_000_000;
    const tabs = [makeTab(1)];
    const meta: Record<number, TabMeta> = { 1: makeMeta(now - THRESHOLD) };
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD)).toEqual([1]);
  });

  it("アクティブタブは除外する", () => {
    const now = 1_000_000;
    const tabs = [makeTab(1, { active: true })];
    const meta: Record<number, TabMeta> = { 1: makeMeta(now - THRESHOLD - 1) };
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD)).toEqual([]);
  });

  it("ピン留めタブは除外する", () => {
    const now = 1_000_000;
    const tabs = [makeTab(1, { pinned: true })];
    const meta: Record<number, TabMeta> = { 1: makeMeta(now - THRESHOLD - 1) };
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD)).toEqual([]);
  });

  it("メタデータが存在しないタブは無視する", () => {
    const now = 1_000_000;
    const tabs = [makeTab(1)];
    const meta: Record<number, TabMeta> = {};
    expect(getTabsToCloseByIdle(tabs, meta, now, THRESHOLD)).toEqual([]);
  });

  it("id が undefined のタブは無視する", () => {
    const now = 1_000_000;
    const tab = makeTab(1);
    tab.id = undefined;
    const meta: Record<number, TabMeta> = {};
    expect(getTabsToCloseByIdle([tab], meta, now, THRESHOLD)).toEqual([]);
  });
});
