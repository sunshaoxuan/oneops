# タスク学習記録

## task_type

Backlog 複数プロジェクト検索テンプレート、項目検出、課題集約及び UI 受入。

## reusable_pattern

プロジェクトをテンプレートの境界とし、プロジェクト選択後に項目メタデータを取得する。テンプレートは項目 ID と項目名を保存し、検索時にテンプレート単位で実行する。全件を固定課題 DTO へ変換し、外部課題物理 ID で重複排除した後に並び替えとページングを行う。

## failure_or_correction

旧顧客画面は顧客単位で Backlog プロジェクト関係を保存しており、全顧客が共通プロジェクトを利用する業務規則と一致しなかった。ユーザー要件に従い、プロジェクト、項目及び有効状態をシステム共通テンプレート層へ移した。

認証後の実選択肢が当初の調査記録と異なったため、保存済み API Key の本人確認、通常のプロジェクト一覧、管理者向け `all=true` の応答を分けて再確認した。現在は目標三プロジェクトを取得でき、三テンプレートを保存できた。

## candidate_skill

Backlog 外部システムのプロジェクト項目検出、テンプレート検証、共通 DTO 集約及び ID 重複排除フロー。

## candidate_validator

プロジェクト及び項目が Backlog API 由来であることを検証し、存在しないプロジェクト又は項目を拒否する。顧客値照合に対応しない項目型を拒否し、複数テンプレートの出力を同一の `normalizeIssue` 関数へ通すことを検証する。

## install_status

候補フローを OneOps ソースへ実装済みであり、独立した正式 skill 又は validator としては未導入である。

## evidence_paths

1. `app/gateway/backlog-search-templates.mjs`
2. `app/gateway/external-task-settings.mjs`
3. `app/gateway/inquiry-support-routes.mjs`
4. `app/db/migrations/029_create_backlog_search_templates.sql`
5. `docs/investigations/backlog-search-templates-20260805/test_results.md`

## rollback

テンプレートの利用停止後にテンプレートレコードを削除する。コードをロールバックする場合は Migration 029 の追加テーブルを除去し、顧客ルートを旧プロジェクト対応経路へ戻す。正式ロールバック前に作成済みテンプレートの保存要否を確認する。

## acceptance_update

顧客 Code `0220` の関連タスク及びチケットで 23 件を共通列へ表示し、顧客 Code `ONEHR` では一致課題なしを確認した。`TS2_ITS`、`TECH_SUPPORT`、`OHR_TOKYO` の三テンプレートは有効状態で表示され、ブラウザーコンソールは空であった。

## new_reusable_finding

Backlog の通常プロジェクト一覧で目標プロジェクトを利用できても、`all=true` が 403 になる場合がある。プロジェクト利用権限とスペース全体管理者権限を別の診断項目として扱う。
