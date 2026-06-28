import { describe, it, expect } from 'vitest';

import { computeSortMoves } from '../src/lib/sort';

function makeTab(
  id: number,
  windowId: number,
  index: number,
  hostname: string,
  pinned = false,
): chrome.tabs.Tab {
  return {
    id,
    windowId,
    index,
    pinned,
    active: false,
    highlighted: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    url: `https://${hostname}/`,
    title: `Tab ${id}`,
  } as chrome.tabs.Tab;
}

describe('computeSortMoves', () => {
  it('ドメイン昇順に並び替える move 計画を返す', () => {
    const tabs = [makeTab(1, 1, 0, 'z.com'), makeTab(2, 1, 1, 'a.com'), makeTab(3, 1, 2, 'm.com')];
    const moves = computeSortMoves(tabs);
    // 期待: a.com(id=2) → index 0, m.com(id=3) → index 1, z.com(id=1) → index 2
    expect(moves).toEqual([
      { tabId: 2, index: 0 },
      { tabId: 3, index: 1 },
      { tabId: 1, index: 2 },
    ]);
  });

  it('既にソート済みなら空配列を返す', () => {
    const tabs = [makeTab(1, 1, 0, 'a.com'), makeTab(2, 1, 1, 'b.com'), makeTab(3, 1, 2, 'z.com')];
    expect(computeSortMoves(tabs)).toEqual([]);
  });

  it('ピン留めタブはスキップしてインデックス計算に含めない', () => {
    const tabs = [
      makeTab(0, 1, 0, 'pinned.com', true), // ピン留め
      makeTab(1, 1, 1, 'z.com'),
      makeTab(2, 1, 2, 'a.com'),
    ];
    const moves = computeSortMoves(tabs);
    // ピン留め以外: a.com → index 1, z.com → index 2
    expect(moves).toEqual([
      { tabId: 2, index: 1 },
      { tabId: 1, index: 2 },
    ]);
  });

  it('同じドメインは元の順序を維持(安定ソート)', () => {
    const tabs = [
      makeTab(1, 1, 0, 'b.com'),
      makeTab(2, 1, 1, 'a.com'),
      makeTab(3, 1, 2, 'a.com'), // 同ドメイン、後方
      makeTab(4, 1, 3, 'c.com'),
    ];
    const moves = computeSortMoves(tabs);
    // a.com(id=2) → 0, a.com(id=3) → 1, b.com(id=1) → 2, c.com(id=4) → 3
    expect(moves).toEqual([
      { tabId: 2, index: 0 },
      { tabId: 3, index: 1 },
      { tabId: 1, index: 2 },
    ]);
  });

  it('複数ウィンドウはそれぞれ独立してソートする', () => {
    const tabs = [
      makeTab(1, 1, 0, 'z.com'),
      makeTab(2, 1, 1, 'a.com'),
      makeTab(3, 2, 0, 'y.com'),
      makeTab(4, 2, 1, 'b.com'),
    ];
    const moves = computeSortMoves(tabs);
    expect(moves).toEqual([
      { tabId: 2, index: 0 },
      { tabId: 1, index: 1 },
      { tabId: 4, index: 0 },
      { tabId: 3, index: 1 },
    ]);
  });

  it('id が undefined のタブは無視する', () => {
    const tab = makeTab(1, 1, 0, 'z.com');
    tab.id = undefined;
    const tab2 = makeTab(2, 1, 1, 'a.com');
    expect(computeSortMoves([tab, tab2])).toEqual([]);
  });
});
