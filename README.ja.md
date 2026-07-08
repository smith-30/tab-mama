# tab-mama

<img src="public/icons/icon-128.png" width="96" alt="tab-mama icon"/>

[![CI](https://github.com/smith-30/tab-mama/actions/workflows/ci.yml/badge.svg)](https://github.com/smith-30/tab-mama/actions/workflows/ci.yml)
[![prek](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/j178/prek/master/docs/assets/badge-v0.json)](https://github.com/j178/prek)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/smith-30/tab-mama/badge)](https://securityscorecards.dev/viewer/?uri=github.com/smith-30/tab-mama)
[![dist size](https://img.shields.io/endpoint?url=https://smith-30.github.io/tab-mama/badges/dist-size.json)](https://github.com/smith-30/tab-mama/actions/workflows/ci.yml)

[English](README.md) | [简体中文](README.zh-CN.md)

Chrome タブを自動管理する拡張機能(Manifest V3)。

## 機能

- **アイドルクローズ** — 設定した時間(デフォルト 60 分)触られなかったタブを自動で閉じる
- **重複クローズ** — 同じ URL のタブが複数ある場合、古いタブ(開いてから 10 分以上経過)を閉じて最新を残す
- **ドメイン整列** — 5 分ごとにタブを hostname のアルファベット順に並び替える。同一ドメイン内は開いた時刻が古い順

ピン留めタブ・現在アクティブなタブ・音声再生中のタブは常に除外。

## 設定

ポップアップから以下を変更できる。設定値は `chrome.storage.local` に保存され再起動後も維持される。

| 設定 | デフォルト | 範囲 |
|---|---|---|
| タブ上限(ピン留め除く) | 10 個 | 1〜99 個 |
| アイドル閾値 | 60 分 | 10〜480 分(10 分刻み) |

タブ上限以下の場合、アイドルクローズ・重複クローズは実行されない。

## 開発

### セットアップ

```bash
pnpm install
```

### コマンド

| コマンド | 説明 |
|---|---|
| `pnpm test` | 単体テストを実行(vitest) |
| `pnpm test:watch` | テストをウォッチモードで実行 |
| `pnpm lint` | oxlint でリント |
| `pnpm lint:fix` | oxlint で自動修正 |
| `pnpm format` | oxfmt でフォーマット |
| `pnpm format:check` | oxfmt でフォーマット確認のみ |
| `pnpm build` | `dist/` へプロダクションビルド |
| `pnpm dev` | 開発ビルド(HMR) |
| `pnpm dev:shot` | 開発用の言語トグルを隠した開発サーバー(スクショ用) |

### Chrome への読み込み

1. `pnpm build` を実行
2. `chrome://extensions` を開く
3. 右上の「デベロッパーモード」を ON
4. 「パッケージ化されていない拡張機能を読み込む」→ `dist/` を選択

## アーキテクチャ

```
src/
├── config.ts           # デフォルト閾値定数
├── background/
│   └── index.ts        # Service Worker — alarm + イベントリスナー配線
├── lib/                # Chrome API に依存しない純粋ロジック
│   ├── idle.ts         # アイドルクローズ対象 tabId を算出
│   ├── dedup.ts        # 重複クローズ対象 tabId を算出
│   ├── sort.ts         # ドメイン整列の move 計画を算出
│   └── types.ts        # 共通型定義
├── storage/
│   └── tabMeta.ts      # chrome.storage.local ラッパ(タブメタデータ / enabled / 設定値)
├── chrome/
│   └── tabs.ts         # chrome.tabs / alarms 操作ラッパ
└── popup/
    ├── index.html
    ├── main.tsx
    └── App.tsx         # 電源トグル / タブ数表示 / 設定 UI
tests/
├── idle.test.ts
├── dedup.test.ts
└── sort.test.ts
```

### コード品質

| ツール | 役割 |
|---|---|
| **oxlint** | TypeScript / React / unicorn 等のルールセットでリント |
| **oxfmt** | Prettier 互換フォーマッター(`singleQuote` / `trailingComma: all` / `sortImports`) |
| **secretlint** | コミット前のシークレット漏洩チェック |
| **prek** | pre-commit フックランナー(Rust 製) |

コミット時に `oxfmt --check` → `oxlint` → `secretlint` → `vitest` の順で自動実行される。

### MV3 の制約への対応

Service Worker はアイドル時に破棄されるため `setTimeout` で長時間タイマーを持つことができない。そこで:

- タブの `openedAt` / `lastActiveAt` / `url` を `chrome.storage.local` に永続化
- `chrome.alarms` で定期的に起床してスキャン・処理(SW 破棄後も alarm で復帰)
- 設定値(タブ上限・アイドル閾値)も `chrome.storage.local` に保存し、alarm ハンドラが毎回読み込む
