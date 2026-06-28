import type { SortMove } from '../lib/types';

export async function closeTabs(tabIds: number[]): Promise<void> {
  if (tabIds.length === 0) return;
  await chrome.tabs.remove(tabIds);
}

export async function applyMoves(moves: SortMove[]): Promise<void> {
  // タブ移動は index が連鎖するため逐次実行が必要
  for (const { tabId, index } of moves) {
    // eslint-disable-next-line no-await-in-loop
    await chrome.tabs.move(tabId, { index });
  }
}

export async function queryAllTabs(): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query({});
}

export async function getActiveTabInWindow(windowId: number): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ windowId, active: true });
  return tabs[0];
}
