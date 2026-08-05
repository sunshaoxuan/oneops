# テスト結果

| 検証 | 結果 | 証拠 |
| --- | --- | --- |
| Gateway 関連単体テスト | 合格、42 件 | バンドル Node.js で `backlog-search-templates.test.mjs`、`inquiry-support.test.mjs`、`external-task-settings.test.mjs` を実行 |
| Portal 単体テスト | 合格、141 件、17 ファイル | `vitest run` |
| Portal TypeScript | 合格 | `tsc -b apps/portal-shell/tsconfig.json` |
| Portal production build | 合格 | `vite build` |
| Migration 029 | 合格、本機 DB のテンプレート件数 0 件 | PostgreSQL 適用後の照会 |
| 実 Backlog 複数テンプレート | 合格、0220 一橋大学の対象課題 23 件、TS2_ITS と TECH_SUPPORT を表示 | 顧客情報画面の関連タスク及びチケット、1 ページ目 20 件、2 ページ目 3 件 |
| 正式候補配信 | 合格、SYSTEM 実行の配信タスクが `delivery_succeeded` を記録 | `app/logs/continuous-delivery.log` |
| 入口ヘルスチェック | 合格、443、8092、8093 が正常待受、8092 と 8093 の Health が UP | 本機実行確認 |
| ブラウザー認証後画面 | 合格、三テンプレート保存、顧客課題画面、warning と error なし | 内蔵ブラウザーの認証後 DOM、画面スクリーンショット、コンソール確認 |
| Backlog プロジェクト選択 | 合格、11 件中に `TS2_ITS`、`TECH_SUPPORT`、`OHR_TOKYO` を確認 | 認証後テンプレート追加画面及び保存結果 |
| Backlog `all=true` 範囲確認 | 参考確認、403 | プロジェクト利用可能性とスペース全体管理者権限の差分確認 |

Vite は既存のチャンクサイズ警告を出力した。ビルドは成功している。

認証後のシステム管理画面で三テンプレートを保存し、顧客情報画面で複数プロジェクトの課題を共通列へ集約して表示できた。`OHR_TOKYO` は自動属性なしのため件名照合を使い、今回の二顧客では一致課題がなかった。課題 ID の重複排除は単体テストで確認した。ブラウザーコンソールは空であった。

Backlog 公式仕様では、`GET /api/v2/projects` は既定では参加済みプロジェクトを返し、管理者に限り `all=true` で全プロジェクトを返す。今回の API Key は通常のプロジェクト一覧と自動属性取得に使用でき、`all=true` は 403 であった。プロジェクトを使用できることとスペース全体管理者権限は別の確認項目として記録する。
