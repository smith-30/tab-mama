import type { TabMeta } from "../lib/types";

const ENABLED_KEY = "__enabled__";

type StorageData = Record<string, TabMeta | boolean>;

export async function getAllMeta(): Promise<Record<number, TabMeta>> {
  const data = (await chrome.storage.local.get(null)) as StorageData;
  const result: Record<number, TabMeta> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === ENABLED_KEY) continue;
    const id = Number(key);
    if (!isNaN(id)) result[id] = value as TabMeta;
  }
  return result;
}

export async function setMeta(tabId: number, meta: TabMeta): Promise<void> {
  await chrome.storage.local.set({ [String(tabId)]: meta });
}

export async function updateLastActive(tabId: number, now: number): Promise<void> {
  const data = (await chrome.storage.local.get(String(tabId))) as StorageData;
  const existing = data[String(tabId)] as TabMeta | undefined;
  if (!existing) return;
  await chrome.storage.local.set({
    [String(tabId)]: { ...existing, lastActiveAt: now },
  });
}

export async function removeMeta(tabId: number): Promise<void> {
  await chrome.storage.local.remove(String(tabId));
}

export async function getEnabled(): Promise<boolean> {
  const data = await chrome.storage.local.get(ENABLED_KEY);
  return (data[ENABLED_KEY] as boolean | undefined) ?? true;
}

export async function setEnabled(value: boolean): Promise<void> {
  await chrome.storage.local.set({ [ENABLED_KEY]: value });
}
