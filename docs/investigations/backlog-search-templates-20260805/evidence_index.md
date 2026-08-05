# 証拠一覧

| ID | 主張 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- | --- |
| E1 | TS2_ITS に機関名自動属性がある | Backlog API `/projects/155893/customFields` の実取得 | high | 対象 API Key の可視範囲に依存 |
| E2 | TECH_SUPPORT に顧客自動属性がある | Backlog API `/projects/155379/customFields` の実取得 | high | 対象 API Key の可視範囲に依存 |
| E3 | リスト型課題検索は自動属性項目 ID を送信する | Backlog Developer API 課題一覧、課題件数の仕様 | high | 外部仕様変更時は再確認が必要 |
| E4 | 複数テンプレート結果を共通課題モデルへ変換する | `app/gateway/external-task-settings.mjs` | high | 本番プロセスの再起動後に実配信確認が必要 |
| E5 | 課題 ID で重複排除する | Gateway 単体テスト「複数 Backlog 検索テンプレートを共通形式へ集約し ID で重複排除する」 | high | テストはスタブ API を使用 |
| E6 | 顧客画面は共通テンプレートを使う | `app/gateway/customer-information-routes.mjs`、`CustomerInformationPage.tsx` | high | 初期テンプレートは未登録 |
| E7 | テンプレート表を DB で保持する | `app/db/migrations/029_create_backlog_search_templates.sql`、本機 DB 適用結果 | high | 本番配信側 DB は配信時に migration 適用が必要 |
| E8 | 認証後に Backlog テンプレート管理画面を表示できる | 内蔵ブラウザーの `https://192.168.20.54/system-management/inquiry-support`、三件の保存成功表示、テンプレート表、スクリーンショット及びコンソール確認 | high | 保存済み認証情報の値は記録していない |
| E9 | 現在の API Key で目標プロジェクトを取得できる | 認証後のテンプレート追加画面及び実 API 取得結果。11 件中に `TS2_ITS`、`TECH_SUPPORT`、`OHR_TOKYO` を確認 | high | 取得範囲は API Key 所有ユーザーの Backlog 権限に依存 |
| E10 | `TS2_ITS`、`TECH_SUPPORT`、`OHR_TOKYO` の三テンプレートを保存できる | システム管理画面の保存成功表示及びテンプレート表 | high | OHR_TOKYO は今回の二顧客では一致課題 0 件 |
| E11 | 複数テンプレートを同一画面で実行し、共通列へ集約できる | 顧客 Code `0220` の関連タスク及びチケット画面。23 件を 20 件と 3 件に分けて表示し、TS2_ITS と TECH_SUPPORT を確認 | high | 今回の実データでは同一課題が複数テンプレートへ一致する例は未確認 |
| E12 | Backlog 課題 ID で重複排除する | `app/gateway/external-task-settings.mjs` の `Map` 実装及び「複数 Backlog 検索テンプレートを共通形式へ集約し ID で重複排除する」テスト | high | 実データの重複条件は単体テストで検証 |
| E13 | Backlog のプロジェクト一覧は管理者の `all=true` 指定で結果範囲が変わる | Backlog 公式 Get Project List 仕様、現行 `listProjects()` の `/projects` 呼び出し、`/projects?all=true` の 403 実測 | high | プロジェクト利用権限とスペース全体管理者権限は別に扱う |
| E14 | Backlog 顧客一覧の全 8 列をサーバーソートできる | `CustomerInformationPage.tsx`、`customer-information-routes.mjs`、`external-task-settings.mjs`、Portal と Gateway 試験 | high | 現行 Browser では件名と状態を実画面で確認し、全列は静的及び単体試験で確認 |
| E15 | 問合顧客一覧の全 6 列をサーバーソートできる | `CustomerInformationPage.tsx`、`customer-information-routes.mjs`、Gateway の全結果ソート後ページング試験 | high | 外部 UPDS の取得上限は従来どおり |
| E16 | 顧客一覧の列幅調整手段を共通化し、値をブラウザーストレージへ保存する | `CustomerResizableHeaderCell`、`column-resize-handle`、列幅状態及び Portal テスト | high | Browser CUA の座標ドラッグは横スクロールへ解釈され、キーボード幅変更を実測 |
| E17 | 追加変更後の実行環境が稼働している | 静的配信ログ、8092 と 8093 の Health、正式 HTTPS 顧客画面 DOM、Screenshot、Console 0 件 | high | Nginx の正式ローリング reload は未実行 |

## 外部仕様

1. [Backlog 課題一覧 API](https://developer.nulab.com/ja/docs/backlog/api/2/get-issue-list/)
2. [Backlog 課題件数 API](https://developer.nulab.com/docs/backlog/api/2/count-issue/)
3. [Backlog カスタム属性一覧 API](https://developer.nulab.com/ja/docs/backlog/api/2/get-custom-field-list/)
