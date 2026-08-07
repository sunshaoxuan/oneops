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
