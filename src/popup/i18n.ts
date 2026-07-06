// フォールバック用の日本語メッセージ。
// 本番(dist 読み込み)では chrome.i18n が _locales から解決するため使われない。
// dev(vite)では _locales がディスク上に無く getMessage が空を返すため、
// あるいはロケール未反映のときに、ここへフォールバックしてブランク表示を防ぐ。
// $1 は getMessage と同じく置換トークン(数値を注入する箇所)。
const FALLBACK_JA: Record<string, string> = {
  appDesc: 'タブを自動管理する拡張機能',
  activeTabs: '起動中のタブ',
  featureIdleClose: '放置 $1 分で自動クローズ',
  featureDedupClose: '重複 URL を $1 分後に自動クローズ',
  featureDomainSort: '$1 分ごとにドメイン順で整列',
  settingTabLimit: 'タブ上限(ピン留め除く)',
  settingIdleTime: '自動クローズまでの時間',
  unitMinutes: '分',
};

export function t(key: string, subs?: string[]): string {
  const msg = chrome.i18n?.getMessage?.(key, subs);
  if (msg) return msg;
  let raw = FALLBACK_JA[key] ?? key;
  if (subs && subs.length > 0) raw = raw.replaceAll('$1', subs[0]);
  return raw;
}
