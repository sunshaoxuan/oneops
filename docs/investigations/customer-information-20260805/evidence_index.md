# 証拠一覧

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 顧客は既存組織機関物理 ID を使用する | `app/gateway/database.mjs` | 高 | 現行 Source 基準 |
| 原環境情報は顧客物理 ID 配下で動作する | `app/gateway/environment-database.mjs`、`app/apps/portal-shell/src/EnvironmentPage.tsx` | 高 | 現行 Source 基準 |
| 問合検索は担当者条件を省略できる | `app/gateway/inquiry-support-routes.mjs`、`app/gateway/inquiry-support-source.mjs` | 高 | 外部サイト応答は設定と稼働状態に依存 |
| 個人 Backlog は本人担当へ限定する | `app/gateway/personal-task-connectors.mjs` | 高 | 顧客チケット API では再利用しない |
| 顧客情報六頁と URL 正規化 | `CustomerInformationPage.tsx`、`App.tsx`、`portal-navigation.ts` | 高 | 隔離受入環境 |
| 契約、VPN、Backlog 対応の物理 ID 外部キー | `028_create_customer_information.sql` | 高 | 独立 PostgreSQL 18.4 で適用確認 |
| 有効契約と環境製品の統合 | `customer-information-database.mjs`、DB 統合確認 | 高 | 判定日は 2026年8月5日 |
| 問合一覧は顧客 Code を設定し担当者条件を送信しない | `customer-information-routes.mjs`、`customer-information.test.mjs` | 高 | UPDS の最大 500 件表示上限あり |
| Backlog は顧客対応プロジェクトを `offset` と `count` でページングする | `external-task-settings.mjs`、`customer-information.test.mjs` | 高 | 実資格情報を含まない Fixture 検証 |
| 広幅画面で問合第 2 頁と Backlog 第 3 頁を表示 | `docs/evidence/customer-information-backlog-20260805.png` | 高 | 隔離 Fixture 環境 |
| 705 px で頁全体の横方向溢れがない | `docs/evidence/customer-information-narrow-20260805.png`、Browser 計測 | 高 | 内容幅 705 px |
| Console warning 及び error が 0 件 | Browser 最終ログ | 高 | 第二次 Browser セッション終了直前 |
| Gateway、Builder、Portal、Spring Backend、Build | `test_results.md` | 高 | 0.9.2 統合基線で再実行済み |
| 正式 HTTPS の顧客情報六頁 | 正式 Browser DOM と Screenshot | 高 | 2026年8月5日受入 |
| ローリング配信中の継続利用 | HTTPS Health 174 件及び Queue 収口 1301 件が全件 HTTP 200 | 高 | ローカル正式環境 |
| 顧客 Backlog 一覧の全 8 列ソート | `CustomerInformationPage.tsx`、`external-task-settings.mjs`、Gateway テスト、正式 Browser DOM | 高 | 8 列すべての `sorter` を静的及び Portal 試験で確認 |
| 顧客問合一覧の全 6 列ソート | `CustomerInformationPage.tsx`、`customer-information-routes.mjs`、Gateway テスト、正式 Browser DOM | 高 | UPDS 取得上限は既存制約 |
| 顧客一覧の列幅調整 | `CustomerResizableHeaderCell`、`column-resize-handle`、正式 Browser の手柄及び幅実測 | 高 | 座標ドラッグは Browser CUA で横スクロールへ解釈 |
| 追加変更後の全量試験 | `test_results.md`、Gateway 177、Builder 14、Portal 146、Build | 高 | Vite の既存チャンク警告あり |
