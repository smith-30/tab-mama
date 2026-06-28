import { closeTabs, applyMoves, queryAllTabs } from '../chrome/tabs';
import {
  ALARM_DOMAIN_SORT,
  ALARM_IDLE_SCAN,
  DEDUP_MIN_AGE_MS,
  IDLE_CLOSE_MS,
  IDLE_SCAN_INTERVAL_MIN,
  SORT_INTERVAL_MIN,
  TAB_FREE_LIMIT,
} from '../config';
import { getTabsToCloseByDedup } from '../lib/dedup';
import { getTabsToCloseByIdle } from '../lib/idle';
import { computeSortMoves } from '../lib/sort';
import type { TabMeta } from '../lib/types';
import { getAllMeta, getEnabled, removeMeta, setMeta, updateLastActive } from '../storage/tabMeta';

// --- アラーム設定 ---

function setupAlarms() {
  chrome.alarms.create(ALARM_IDLE_SCAN, {
    periodInMinutes: IDLE_SCAN_INTERVAL_MIN,
  });
  chrome.alarms.create(ALARM_DOMAIN_SORT, {
    periodInMinutes: SORT_INTERVAL_MIN,
  });
}

// --- 重複チェック ---

async function runDedup() {
  if (!(await getEnabled())) return;
  const tabs = await queryAllTabs();
  const meta = await getAllMeta();
  const toClose = getTabsToCloseByDedup(tabs, meta, Date.now(), DEDUP_MIN_AGE_MS, TAB_FREE_LIMIT);
  await closeTabs(toClose);
}

// --- アラームハンドラ ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!(await getEnabled())) return;

  if (alarm.name === ALARM_IDLE_SCAN) {
    const tabs = await queryAllTabs();
    const meta = await getAllMeta();
    const now = Date.now();
    const idleClose = getTabsToCloseByIdle(tabs, meta, now, IDLE_CLOSE_MS, TAB_FREE_LIMIT);
    const dedupClose = getTabsToCloseByDedup(tabs, meta, now, DEDUP_MIN_AGE_MS, TAB_FREE_LIMIT);
    const toClose = [...new Set([...idleClose, ...dedupClose])];
    await closeTabs(toClose);
  }

  if (alarm.name === ALARM_DOMAIN_SORT) {
    const tabs = await queryAllTabs();
    const moves = computeSortMoves(tabs);
    await applyMoves(moves);
  }
});

// --- タブイベントリスナー ---

chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.id == null) return;
  const now = Date.now();
  const meta: TabMeta = {
    openedAt: now,
    lastActiveAt: now,
    url: tab.url ?? tab.pendingUrl ?? '',
  };
  await setMeta(tab.id, meta);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' && changeInfo.url == null) return;
  const newUrl = tab.url ?? '';
  const meta = await getAllMeta();
  const existing = meta[tabId];
  if (existing) {
    await setMeta(tabId, { ...existing, url: newUrl });
  } else {
    const now = Date.now();
    await setMeta(tabId, { openedAt: now, lastActiveAt: now, url: newUrl });
  }
  // URL 更新後に重複チェック
  await runDedup();
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await updateLastActive(tabId, Date.now());
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const tabs = await chrome.tabs.query({ windowId, active: true });
  if (tabs[0]?.id != null) {
    await updateLastActive(tabs[0].id, Date.now());
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await removeMeta(tabId);
});

// --- 起動時の既存タブ補完 ---

async function bootstrapExistingTabs() {
  const tabs = await queryAllTabs();
  const meta = await getAllMeta();
  const now = Date.now();
  await Promise.all(
    tabs
      .filter((tab) => tab.id != null && !meta[tab.id!])
      .map((tab) => setMeta(tab.id!, { openedAt: now, lastActiveAt: now, url: tab.url ?? '' })),
  );
}

chrome.runtime.onInstalled.addListener(() => {
  setupAlarms();
  bootstrapExistingTabs();
});

// SW が再起動した場合もアラームを確実に設定
chrome.alarms.getAll((alarms) => {
  const names = new Set(alarms.map((a) => a.name));
  if (!names.has(ALARM_IDLE_SCAN) || !names.has(ALARM_DOMAIN_SORT)) {
    setupAlarms();
  }
});

bootstrapExistingTabs();
