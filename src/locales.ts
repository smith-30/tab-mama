// UI 文言の単一ソース。
// - アプリ(popup)はここから直接バンドルして使う(dev の言語トグル用に全ロケール保持)。
// - Chrome ネイティブ i18n 用の public/_locales/*/messages.json は
//   vite.config.ts の gen-locales プラグインがここから生成する。
// $1 は数値を注入する置換トークン(chrome.i18n の substitution と対応)。

export const LOCALES = ['ja', 'en', 'zh_CN'] as const;
export type Locale = (typeof LOCALES)[number];

const ja = {
  appDesc: 'タブを自動管理する拡張機能',
  activeTabs: '起動中のタブ',
  pinnedTabsCount: '$1 pinned',
  featureIdleClose: '放置 $1 分で自動クローズ',
  featureDedupClose: '重複 URL を $1 分後に自動クローズ',
  featureDomainSort: '$1 分ごとにドメイン順で整列',
  settingTabLimit: 'タブ上限(ピン留め除く)',
  settingIdleTime: '自動クローズまでの時間',
  unitMinutes: '分',
} as const;

export type MessageKey = keyof typeof ja;

const en: Record<MessageKey, string> = {
  appDesc: 'Automatically manage your browser tabs',
  activeTabs: 'Active tabs',
  pinnedTabsCount: '$1 pinned',
  featureIdleClose: 'Auto-close after $1 min idle',
  featureDedupClose: 'Close duplicate URLs after $1 min',
  featureDomainSort: 'Sort tabs by domain every $1 min',
  settingTabLimit: 'Tab limit (excl. pinned)',
  settingIdleTime: 'Time until auto-close',
  unitMinutes: 'min',
};

const zh_CN: Record<MessageKey, string> = {
  appDesc: '自动管理浏览器标签页的扩展程序',
  activeTabs: '打开的标签页',
  pinnedTabsCount: '其中固定 $1',
  featureIdleClose: '闲置 $1 分钟后自动关闭',
  featureDedupClose: '重复 URL 在 $1 分钟后自动关闭',
  featureDomainSort: '每 $1 分钟按域名排序',
  settingTabLimit: '标签页上限(不含固定)',
  settingIdleTime: '自动关闭前的时间',
  unitMinutes: '分钟',
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { ja, en, zh_CN };

export const LOCALE_LABEL: Record<Locale, string> = {
  ja: '日本語',
  en: 'EN',
  zh_CN: '中文',
};
