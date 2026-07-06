import { type Locale, MESSAGES, type MessageKey } from '../locales';

// dev の言語トグル用のオーバーライド。
// undefined のときは通常動作(本番=chrome.i18n がブラウザ言語で解決、dev=日本語フォールバック)。
let override: Locale | undefined;

export function setLocaleOverride(locale: Locale | undefined): void {
  override = locale;
}

function subst(template: string, subs?: string[]): string {
  if (!subs || subs.length === 0) return template;
  return template.replaceAll('$1', subs[0]);
}

export function t(key: MessageKey, subs?: string[]): string {
  if (override) return subst(MESSAGES[override][key] ?? key, subs);

  // 本番(dist)は _locales から正しいロケールを解決する。
  // dev(vite)は _locales がディスク上に無く空を返すため日本語にフォールバック。
  const msg = chrome.i18n?.getMessage?.(key, subs);
  if (msg) return msg;
  return subst(MESSAGES.ja[key] ?? key, subs);
}
