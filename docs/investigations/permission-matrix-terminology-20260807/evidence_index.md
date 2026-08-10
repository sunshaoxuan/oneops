# 証拠索引

| 証拠 | 内容 | 結果 |
| --- | --- | --- |
| E-01 | `app/db/migrations/034_scoped_customer_ledger_extraction.sql` の権限資源及び操作 | `CUSTOMER_KNOWLEDGE`、`USE`、`REVIEW`、`MANAGE` を確認 |
| E-02 | `permission-matrix.ts` の表示キー正規化 | 大文字資源と操作を同じ行と列へ統合 |
| E-03 | Portal 日本語ロール編集画面 DOM | `機能ノード`、`閲覧`、`編集`、`利用`、`確認`、`管理`、`代理ログイン` を確認 |
| E-04 | 顧客ナレッジ行の DOM | `顧客情報 > 顧客ナレッジ管理` を確認 |
| E-05 | ブラウザー寸法 | `html.clientWidth=1280`、`html.scrollWidth=1280`、`body.clientWidth=1265`、`body.scrollWidth=1265`、`table.clientWidth=910`、`table.scrollWidth=910` |
| E-06 | ブラウザー Console | warning 0、error 0 |
| E-07 | 画面スクリーンショット | `docs/evidence/permission-matrix-terminology-20260807.png`、`docs/evidence/permission-matrix-terminology-20260807-full.png` |
| E-08 | Portal Shell 自動試験 | 18 ファイル、158 件成功 |
| E-09 | 正式配信検証 | Gateway 206 件、Python 14 件、Portal 158 件、Spring Boot 33 件中失敗 0、Nginx 設定成功 |
| E-10 | `app/db/migrations/037_add_inquiry_assist_run_ownership_and_soft_delete.sql` | `inquiries.deleted.read`、資源 `inquiries.deleted`、操作 `read` 及び管理者への初期割当を確認 |
| E-11 | Portal Shell 専用試験 | 27 ファイル、188 件成功 |
| E-12 | Portal Shell TypeScript と Vite 本番ビルド | 成功、既知の chunk size warning のみ |
| E-13 | 静的 Portal 配信 | `delivery_succeeded`、Gateway 再起動なし、Nginx 構文検査成功、HTTPS 入口応答成功 |
| E-14 | 正式 HTTPS Browser | ログイン画面、SSO ボタン及び Console warning/error 0 件を確認。認証済み権限行の DOM とスクリーンショットは `evidence_missing` |
| E-15 | 全量 `pnpm check` | 変更範囲外の `gateway/model-settings.test.mjs` 1 件失敗。正式リリース判定には未使用 |
