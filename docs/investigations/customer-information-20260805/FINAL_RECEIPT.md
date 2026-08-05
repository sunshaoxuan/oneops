# 最終受入記録

状態: 正式配信及び最終受入完了

| No. | 原要求 | 成果物及び証拠 | 状態 |
| --- | --- | --- | --- |
| 1 | 三言語の顧客情報名称 | `i18n.ts`、`i18n.test.ts` | 合格 |
| 2 | `/customers` と再読込 | `portal-navigation.ts`、Browser | 合格 |
| 3 | 旧 `/environments` の正規化 | `App.tsx`、Browser | 合格 |
| 4 | 六頁を指定順序で表示 | `CustomerInformationPage.tsx`、Browser | 合格 |
| 5 | 選択中顧客の物理 ID と基本情報 | `customer-information-database.mjs`、Browser | 合格 |
| 6 | 製品及びサービス契約の管理 | Migration 028、API、Database 検証 | 合格 |
| 7 | 有効契約と稼働環境製品 | Database 検証、Browser | 合格 |
| 8 | VPN の管理 | Migration 028、API、Database 検証 | 合格 |
| 9 | 従来の環境、端点、資格情報 | `EnvironmentPage.tsx`、Browser の AP01 と 10.0.0.10 | 合格 |
| 10 | 顧客限定、担当者非限定の問合ページ | Route 試験、Browser 第 2 頁 | 合格。外部 500 件上限を明示 |
| 11 | プロジェクト限定、担当者非限定の Backlog API ページ | Route 試験、Browser 第 3 頁 | 合格 |
| 12 | 権限及び設定不足の安全な表示 | Route、画面、監査試験 | 合格 |
| 13 | 試験、Build、配信、Browser、Console、Screenshot | `test_results.md`、正式 HTTPS、Browser Screenshot | 合格 |
| 14 | 最終受入を先頭から逐項確認 | 本記録、正式 0.9.2 | 合格 |

全項目を正式 HTTPS 画面で先頭から再実行し、2026年8月5日に合格した。

## 追加変更受入

問合情報及び関連タスク及びチケットの全表示列へサーバーソートを追加し、件名昇順を既定値とした。問合は 6 列、Backlog は 8 列を対象とし、完全結果集合のソート後にページングする。各列へ最小幅付き列幅調整手柄を配置し、調整値をブラウザーストレージへ保存する。

Gateway 177 件、Builder 14 件、Portal 146 件、Production Build、正式 HTTPS の顧客 Code `0220`、両一覧の Browser DOM、Screenshot 及び Console 0 件を確認した。列幅は手柄表示とキーボード操作による実測を確認した。座標ドラッグは Browser CUA の横スクロール解釈により幅変化を検出できなかったため、その制約を証拠へ明記した。

静的 Portal 配信及び 8092、8093 の再起動後 Health は合格。Nginx の正式ローリング reload は今回実行していない。
