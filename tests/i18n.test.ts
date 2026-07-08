import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocaleOverride, t } from '../src/popup/i18n';
import { installChromeMock } from './helpers/chrome';

describe('t()', () => {
  afterEach(() => {
    setLocaleOverride(undefined);
    vi.unstubAllGlobals();
  });

  it('chrome.i18n が値を返せばそれを使う', () => {
    installChromeMock({ i18nMessage: () => 'FROM_CHROME' });
    expect(t('activeTabs')).toBe('FROM_CHROME');
  });

  it('chrome.i18n が空文字なら日本語にフォールバックする(dev 相当)', () => {
    installChromeMock({ i18nMessage: () => '' });
    expect(t('activeTabs')).toBe('起動中のタブ');
  });

  it('フォールバック時に $1 を置換する', () => {
    installChromeMock({ i18nMessage: () => '' });
    expect(t('featureIdleClose', ['60'])).toBe('放置 60 分で自動クローズ');
  });

  it('override が chrome.i18n より優先される', () => {
    installChromeMock({ i18nMessage: () => 'FROM_CHROME' });
    setLocaleOverride('en');
    expect(t('activeTabs')).toBe('Active tabs');
    expect(t('featureIdleClose', ['30'])).toBe('Auto-close after 30 min idle');
  });

  it('override で中国語も置換できる', () => {
    installChromeMock({ i18nMessage: () => '' });
    setLocaleOverride('zh_CN');
    expect(t('featureDomainSort', ['5'])).toBe('每 5 分钟按域名排序');
  });
});
