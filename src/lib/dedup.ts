import type { TabMeta } from "./types";

export function getTabsToCloseByDedup(
  tabs: chrome.tabs.Tab[],
  meta: Record<number, TabMeta>,
  now: number,
  minAgeMs: number
): number[] {
  // url → タブのグループ化(メタデータが揃っているものだけ)
  const groups = new Map<string, Array<{ id: number; openedAt: number; active: boolean; pinned: boolean }>>();

  for (const tab of tabs) {
    if (tab.id == null) continue;
    const m = meta[tab.id];
    if (!m) continue;
    const key = m.url;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      id: tab.id,
      openedAt: m.openedAt,
      active: tab.active,
      pinned: tab.pinned,
    });
  }

  const toClose: number[] = [];

  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    // openedAt 降順 → 最新が先頭
    const sorted = [...group].sort((a, b) => b.openedAt - a.openedAt);
    const [_newest, ...rest] = sorted;

    for (const t of rest) {
      if (t.active || t.pinned) continue;
      if (now - t.openedAt >= minAgeMs) {
        toClose.push(t.id);
      }
    }
  }

  return toClose;
}
