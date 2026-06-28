# tab-mama — Claude 向けガイド

## コマンド

```bash
pnpm test        # 単体テスト(vitest)
pnpm test:watch  # ウォッチモード
pnpm build       # dist/ へビルド
```

## アーキテクチャの原則

`src/lib/` は Chrome API に依存しない純粋関数のみ。テストでは `chrome.*` をモックせず、tabs 配列・メタデータ・`now`・閾値をそのまま渡して検証する。

副作用は `src/storage/tabMeta.ts` と `src/chrome/tabs.ts` に隔離し、`src/background/index.ts` で配線する。

## 閾値

`src/config.ts` に集約。ここ以外には書かない。

## MV3 制約

Service Worker はアイドルで破棄される。`setTimeout` による長時間タイマーは使わない。タイマーは必ず `chrome.alarms` で代替し、状態は `chrome.storage.local` に永続化する。

## テストの追加方針

`tests/` に vitest のテストを書く。`lib/` の純粋関数はすべてテストで境界条件(ちょうど閾値、ピン留め・アクティブ除外、重複グループの最新残し、安定ソート)を網羅する。

## ビルド

`@crxjs/vite-plugin` が manifest.json の生成・service worker のバンドルを担う。manifest の定義は `manifest.config.ts` に書き、`vite.config.ts` で読み込む。
