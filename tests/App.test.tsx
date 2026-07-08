// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../src/popup/App';
import { setLocaleOverride } from '../src/popup/i18n';
import { installChromeMock } from './helpers/chrome';

// アイコン/アニメーションライブラリは preact との interop 差異を避けるためモックする。
// App のロジック(i18n ラベル・トグル・storage 連携)の検証が目的で、
// SVG 描画やアニメーション自体はテスト対象外。
vi.mock('lucide-react', async () => {
  const { h } = await import('preact');
  const Icon = (props: Record<string, unknown>) => h('span', { 'data-icon': true, ...props });
  return { ArrowUpDown: Icon, Link2Off: Icon, Timer: Icon };
});

vi.mock('framer-motion', async () => {
  const { h } = await import('preact');
  return {
    motion: new Proxy(
      {},
      {
        get: (_t, tag) =>
          typeof tag === 'symbol'
            ? undefined
            : (props: Record<string, unknown>) => h(tag as string, props),
      },
    ),
    animate: () => ({ stop() {} }),
    useInView: () => false,
    useMotionValue: (v: number) => ({ on: () => () => {}, get: () => v, set() {} }),
    useTransform: () => ({ on: () => () => {} }),
  };
});

describe('<App />', () => {
  let mock: ReturnType<typeof installChromeMock>;

  beforeEach(() => {
    mock = installChromeMock({ tabCount: 7 });
  });

  afterEach(() => {
    cleanup();
    setLocaleOverride(undefined);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('機能ラベルが空にならず表示される(i18n デグレ防止)', async () => {
    render(<App />);
    expect(await screen.findByText(/放置 60 分で自動クローズ/)).toBeInTheDocument();
    expect(screen.getByText(/重複 URL/)).toBeInTheDocument();
    expect(screen.getByText(/ドメイン順で整列/)).toBeInTheDocument();
  });

  it('設定ラベルが表示される', async () => {
    render(<App />);
    expect(await screen.findByText('タブ上限(ピン留め除く)')).toBeInTheDocument();
    expect(screen.getByText('自動クローズまでの時間')).toBeInTheDocument();
  });

  it('言語トグルで英語に切り替わる', async () => {
    render(<App />);
    await screen.findByText(/放置 60 分で自動クローズ/);
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByText('Auto-close after 60 min idle')).toBeInTheDocument();
  });

  it('通常の dev では言語トグルを表示する', async () => {
    render(<App />);
    expect(await screen.findByRole('button', { name: 'EN' })).toBeInTheDocument();
  });

  it('screenshot モードでは言語トグルを表示しない', async () => {
    // SHOW_DEV_TOOLS はモジュール読み込み時に import.meta.env から確定するため、
    // env を差し替えてから App を再 import して評価し直す。
    vi.stubEnv('MODE', 'screenshot');
    vi.resetModules();
    const ScreenshotApp = (await import('../src/popup/App')).default;
    render(<ScreenshotApp />);
    await screen.findByText(/放置 60 分で自動クローズ/);
    expect(screen.queryByRole('button', { name: 'EN' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '中文' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '日本語' })).not.toBeInTheDocument();
  });

  it('電源トグルで enabled が storage に保存される', async () => {
    render(<App />);
    const power = await screen.findByRole('button', { pressed: true });
    fireEvent.click(power);
    await waitFor(() =>
      expect(mock.chrome.storage.local.set).toHaveBeenCalledWith({ __enabled__: false }),
    );
  });

  it('タブ上限のステッパーで値が増える', async () => {
    render(<App />);
    await screen.findByText(/放置 60 分で自動クローズ/);
    fireEvent.click(screen.getAllByText('＋')[0]);
    expect(await screen.findByText('11')).toBeInTheDocument();
    await waitFor(() =>
      expect(mock.chrome.storage.local.set).toHaveBeenCalledWith({ __free_limit__: 11 }),
    );
  });
});
