# tab-mama — Claude 向けガイド

## コマンド

```bash
pnpm test          # 単体テスト(vitest)
pnpm test:watch    # ウォッチモード
pnpm lint          # oxlint でリント
pnpm lint:fix      # oxlint で自動修正
pnpm format        # oxfmt でフォーマット
pnpm format:check  # フォーマット確認のみ
pnpm build         # dist/ へビルド
```

## pre-commit フック

prek を使用。コミット時に以下の順で自動実行される:

1. `oxfmt --check` — フォーマット確認
2. `oxlint` — リント
3. `secretlint` — シークレット漏洩チェック
4. `vitest run` — 単体テスト

コミット前に手動で全フックを試し実行する場合: `prek run --all-files`

## コード品質ルール

**フォーマット(`.oxfmtrc.json`)**: `singleQuote: true`、`trailingComma: "all"`、`printWidth: 100`、`sortImports: true`

**リント(`.oxlintrc.json`)**:
- `correctness: error`、`suspicious/perf: warn`
- プラグイン: typescript / react / react-perf / unicorn / oxc / import / vitest
- `react/react-in-jsx-scope: off`(React 17+ 新 JSX transform のため)
- `typescript/consistent-type-imports: error`(型 import の `import type` を徹底)

## アーキテクチャの原則

`src/lib/` は Chrome API に依存しない純粋関数のみ。テストでは `chrome.*` をモックせず、tabs 配列・メタデータ・`now`・閾値をそのまま渡して検証する。

副作用は `src/storage/tabMeta.ts` と `src/chrome/tabs.ts` に隔離し、`src/background/index.ts` で配線する。

## 閾値

`src/config.ts` に集約。ここ以外には書かない。

## MV3 制約

Service Worker はアイドルで破棄される。`setTimeout` による長時間タイマーは使わない。タイマーは必ず `chrome.alarms` で代替し、状態は `chrome.storage.local` に永続化する。

## テストの追加方針

`tests/` に vitest のテストを書く。`lib/` の純粋関数はすべてテストで境界条件(ちょうど閾値、ピン留め・アクティブ除外、重複グループの最新残し、安定ソート)を網羅する。

`pnpm test`(= `vitest run`)は `tests/**/*.test.{ts,tsx}` を全件実行し、pre-commit(prek の `test` フック)と CI の両方から走る。テストを追加するだけで両方に反映され、設定変更は不要。

### コンポーネントテスト(popup)

- ファイル先頭に `// @vitest-environment jsdom` を付けて jsdom 環境にする(`lib/` のテストは node のまま高速維持)。
- 描画は `@testing-library/preact`。`chrome.*` は `tests/helpers/chrome.ts` の `installChromeMock()` でインメモリにモックする。

**はまりどころ: lucide-react / framer-motion は必ずモックする。**
これらは内部で `react` を import する。ビルド時は rollup が `react → preact/compat` の alias を全モジュールへ適用するので問題ないが、vitest では外部化された依存に alias が届かず、pnpm ネストの実 React に解決されて preact 描画と衝突する(`InvalidCharacterError: "[object Object]" did not match the QName production`)。`resolve.alias` / `dedupe` / `server.deps.inline` では解消しなかった。コンポーネントテストの目的は App のロジック(i18n・トグル・storage 連携)の検証で、SVG やアニメーション自体は対象外なので、`vi.mock('lucide-react', ...)` / `vi.mock('framer-motion', ...)` でスタブに置き換える(`tests/App.test.tsx` 参照)。

- モックの戻り値に **Proxy をモジュールとして返さない**。vitest が名前付き export を認識できず `No "X" export is defined` になり、さらに `.then` を参照して thenable 誤判定でハングする。使う export(アイコン名など)は明示的に列挙する。

## ビルド

`@crxjs/vite-plugin` が manifest.json の生成・service worker のバンドルを担う。manifest の定義は `manifest.config.ts` に書き、`vite.config.ts` で読み込む。
