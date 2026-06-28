import type { SortMove } from './types';

function hostname(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function computeSortMoves(tabs: chrome.tabs.Tab[]): SortMove[] {
  // ウィンドウ別にグループ化
  const byWindow = new Map<number, chrome.tabs.Tab[]>();
  for (const tab of tabs) {
    if (tab.id == null) continue;
    if (!byWindow.has(tab.windowId)) byWindow.set(tab.windowId, []);
    byWindow.get(tab.windowId)!.push(tab);
  }

  const moves: SortMove[] = [];

  for (const winTabs of byWindow.values()) {
    // index 昇順に並べる
    const ordered = winTabs.toSorted((a, b) => a.index - b.index);

    const pinned = ordered.filter((t) => t.pinned);
    const unpinned = ordered.filter((t) => !t.pinned);

    // ソート対象が 1 タブ以下なら移動不要
    if (unpinned.length <= 1) continue;

    // 安定ソート: hostname 昇順(同じなら元の順序を維持)
    const sorted = unpinned.toSorted((a, b) => hostname(a.url).localeCompare(hostname(b.url)));

    // ピン留めは先頭に固定、non-pinned はその後
    const startIndex = pinned.length;

    for (let i = 0; i < sorted.length; i++) {
      const tab = sorted[i];
      const expectedIndex = startIndex + i;
      if (tab.index !== expectedIndex) {
        moves.push({ tabId: tab.id!, index: expectedIndex });
      }
    }
  }

  return moves;
}
