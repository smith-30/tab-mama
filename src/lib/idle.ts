import type { TabMeta } from "./types";

export function getTabsToCloseByIdle(
  tabs: chrome.tabs.Tab[],
  meta: Record<number, TabMeta>,
  now: number,
  thresholdMs: number
): number[] {
  const toClose: number[] = [];
  for (const tab of tabs) {
    if (tab.id == null) continue;
    if (tab.active || tab.pinned) continue;
    const m = meta[tab.id];
    if (!m) continue;
    if (now - m.lastActiveAt >= thresholdMs) {
      toClose.push(tab.id);
    }
  }
  return toClose;
}
