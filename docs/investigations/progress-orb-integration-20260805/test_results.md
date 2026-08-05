# テスト結果

## 実装時点の確認

| 対象 | 結果 | 証拠 |
|---|---|---|
| thinking-orbs 依存解決 | 合格 | `pnpm install --offline --frozen-lockfile --filter @one-ops/portal-shell...` |
| ProgressOrb 単体テスト | 合格、2 件 | `ProgressOrb.test.tsx` |
| Portal TypeScript | 合格 | `tsc -b` |
| Portal 全単体テスト | 合格、18 ファイル、149 件 | `pnpm --filter @one-ops/portal-shell test` |
| Gateway 全単体テスト | 合格、177 件 | `pnpm check` |
| Builder Worker 単体テスト | 合格、14 件 | `pnpm check` |
| Portal production build | 合格、Vite と TypeScript | `pnpm check`、公開 HTML の Asset Hash |
| デスクトップ実行画面 | 合格、Canvas 2 件、既存 Progress 2 件 | 認証済み `https://192.168.20.54/` の DOM |
| 640px 狭幅実行画面 | 合格、Canvas 2 件、横溢れなし | `clientWidth=625`、`scrollWidth=625` |
| ブラウザーコンソール | 合格、警告 0 件、エラー 0 件 | ブラウザー console logs |
| スクリーンショット | 合格 | `docs/evidence/thinking-orbs-workbench-desktop-20260805.png`、`docs/evidence/thinking-orbs-workbench-640-20260805.png` |

## 受入時の実測値

| 画面 | オーブ | ラベル | 進捗バー | 横幅 |
|---|---:|---|---:|---|
| デスクトップ | 2 | `利用可能メモリ`、`空きディスク` | 2 | `1265 / 1265` |
| 640px 狭幅 | 2 | `利用可能メモリ`、`空きディスク` | 2 | `625 / 625` |

全ての Canvas は `role="img"`、`20px × 20px`、`display=block`、`visibility=visible` であった。
