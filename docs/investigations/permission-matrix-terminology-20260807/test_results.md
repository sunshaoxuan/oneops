# テスト結果

## 自動試験

| 対象 | 結果 |
| --- | --- |
| Portal Shell Vitest | 18 ファイル、158 件成功 |
| Portal Shell TypeScript と Vite 本番ビルド | 成功、chunk size warning のみ |
| Gateway Node test | 206 件成功 |
| Builder Python unittest | 14 件成功 |
| Spring Boot Maven test | 33 件、失敗 0、Skip 7 |
| Nginx config test | syntax is ok、test is successful |
| `git diff --check` | 成功 |

## ブラウザー試験

| 確認項目 | 結果 |
| --- | --- |
| 日本語の権限列 | 閲覧、編集、利用、確認、管理、代理ログイン |
| 顧客ナレッジ行 | 顧客情報 > 顧客ナレッジ管理 |
| 英語原文キー | `MANAGE`、`REVIEW`、`USE`、`CUSTOMER_KNOWLEDGE`、`Customer Knowledge` は 0 件 |
| ページ及び行列 | `html.clientWidth=1280`、`html.scrollWidth=1280`、`body.clientWidth=1265`、`body.scrollWidth=1265`、`table.clientWidth=910`、`table.scrollWidth=910` |
| Console | warning 0、error 0 |
| 画面証拠 | `docs/evidence/permission-matrix-terminology-20260807-full.png` |

## 2026-08-10 追加試験

| 対象 | 結果 |
| --- | --- |
| Portal Shell 専用 Vitest | 27 ファイル、188 件成功 |
| Portal Shell TypeScript と Vite 本番ビルド | 成功、chunk size warning のみ |
| `git diff --check` | 成功。既存の並行作業ファイルを含む未コミット差分は保持 |
| Portal 静的配信 | 成功。Gateway 再起動なし、Nginx 設定検査成功、HTTPS 入口応答成功 |
| 正式 HTTPS Browser | 未認証ログイン画面のみ確認。SSO ボタンあり、Console warning/error 0 件。ロール編集画面は `evidence_missing` |
| 全量 `pnpm check` | 失敗。`gateway/model-settings.test.mjs` の `model settings accept only a clean OpenAI compatible API root` が、並行作業中のモデル設定必須項目追加後も旧入力のままのため失敗 |
