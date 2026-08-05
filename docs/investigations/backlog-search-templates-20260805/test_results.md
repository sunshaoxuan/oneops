# テスト結果

| 検証 | 結果 | 証拠 |
| --- | --- | --- |
| Gateway 関連単体テスト | 合格、42 件 | バンドル Node.js で `backlog-search-templates.test.mjs`、`inquiry-support.test.mjs`、`external-task-settings.test.mjs` を実行 |
| Portal 単体テスト | 合格、141 件、17 ファイル | `vitest run` |
| Portal TypeScript | 合格 | `tsc -b apps/portal-shell/tsconfig.json` |
| Portal production build | 合格 | `vite build` |
| Migration 029 | 合格、本機 DB のテンプレート件数 0 件 | PostgreSQL 適用後の照会 |
| 実 Backlog 複数テンプレート | 合格、0220 一橋大学の対象課題 23 件、TS2_ITS と TECH_SUPPORT を表示 | 顧客情報画面の関連タスク及びチケット、1 ページ目 20 件、2 ページ目 3 件 |
| 件名の既定並び順 | 合格、件名昇順で課題を返す | Gateway の昇順及び降順テスト、Portal の列設定テスト |
| 件名のブラウザー切替 | 合格、昇順、降順、再度昇順を確認 | 認証後顧客画面の `aria-sort`、先頭件名及びページング確認 |
| 件名の跨頁順序 | 合格、20 件と 3 件の境界が連続、23 件中 23 件が一意 | 顧客 Code `0220` の実ページ確認 |
| 正式候補配信 | 合格、SYSTEM 実行の配信タスクが `delivery_succeeded` を記録 | `app/logs/continuous-delivery.log` |
| 入口ヘルスチェック | 合格、443、8092、8093 が正常待受、8092 と 8093 の Health が UP | 本機実行確認 |
| ブラウザー認証後画面 | 合格、三テンプレート保存、顧客課題画面、warning と error なし | 内蔵ブラウザーの認証後 DOM、画面スクリーンショット、コンソール確認 |
| Backlog プロジェクト選択 | 合格、11 件中に `TS2_ITS`、`TECH_SUPPORT`、`OHR_TOKYO` を確認 | 認証後テンプレート追加画面及び保存結果 |
| Backlog `all=true` 範囲確認 | 参考確認、403 | プロジェクト利用可能性とスペース全体管理者権限の差分確認 |

Vite は既存のチャンクサイズ警告を出力した。ビルドは成功している。

今回の変更では完全な `publish-portal.ps1` が全テスト、Portal ビルド、Maven テスト及び Nginx 設定検査まで成功したが、Nginx reload 段階で Windows `Access is denied` により終了した。主サービスの Health は正常であり、静的 Portal は実行時再起動を省略する安全な配信経路で配信し、ブラウザー実画面の検証に成功した。正式ローリング配信は Nginx reload 権限の制限を受ける。

認証後のシステム管理画面で三テンプレートを保存し、顧客情報画面で複数プロジェクトの課題を共通列へ集約して表示できた。`OHR_TOKYO` は自動属性なしのため件名照合を使い、今回の二顧客では一致課題がなかった。課題 ID の重複排除は単体テストで確認した。ブラウザーコンソールは空であった。

Backlog 公式仕様では、`GET /api/v2/projects` は既定では参加済みプロジェクトを返し、管理者に限り `all=true` で全プロジェクトを返す。今回の API Key は通常のプロジェクト一覧と自動属性取得に使用でき、`all=true` は 403 であった。プロジェクトを使用できることとスペース全体管理者権限は別の確認項目として記録する。

## 全表示列ソート及び列幅調整の追加受入

| 検証 | 結果 | 証拠 |
| --- | --- | --- |
| Gateway 全量試験 | 合格、177 件 | `pnpm --dir app test` |
| Builder 全量試験 | 合格、14 件 | `pnpm --dir app test` |
| Portal 全量試験 | 合格、146 件、17 ファイル | `pnpm --dir app test` |
| Production Build | 合格 | `pnpm --dir app build`、Vite 3405 modules |
| Backlog 全表示列 | 合格、8 列すべてへ `sorter` と列幅ハンドル | `CustomerInformationPage.tsx`、Portal テスト |
| Backlog 初期及び列切替 | 合格、件名昇順、状態昇順、選択前の件名状態解除 | 顧客 Code `0220` の正式 HTTPS Browser DOM |
| Backlog ソートとページング | 合格、ID 重複排除後の全件を選択列で並べてからページング | Gateway 単体試験、顧客ルート |
| 問合 全表示列 | 合格、6 列すべてへ `sorter` と列幅ハンドル | `CustomerInformationPage.tsx`、Portal テスト |
| 問合 初期及び列切替 | 合格、件名昇順、状態昇順、選択前の件名状態解除 | 顧客 Code `0220` の正式 HTTPS Browser DOM |
| 列幅調整 | 合格、手動ハンドル表示及びキーボード ArrowRight による幅変更を確認。座標ドラッグは現行 Browser CUA で表格スクロールへ解釈され、幅変化を検出できず | 顧客情報 Browser、列幅ハンドル `aria-label=列幅を調整`、列幅 360→374、320→336 |
| Console | 合格、error、warning とも 0 件 | 顧客 Code `0220` の Browser Console |
| 現行環境への反映 | 合格、静的 Portal 配信及び 8092、8093 再起動後 Health UP | `app/logs/continuous-delivery.log`、本机 Health |

正式な Nginx ローリング配信は今回実行していない。静的 Portal と既存 upstream の主系を使用した実行時確認として記録し、Nginx reload 権限問題を含む正式配信判断とは分けて扱う。
