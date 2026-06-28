export interface TabMeta {
  openedAt: number;
  lastActiveAt: number;
  url: string;
}

export interface SortMove {
  tabId: number;
  index: number;
}
