# タスク学習回付

## task_type

権限マトリクスの資源表示及び多言語 UI 修正

## reusable_pattern

権限 API に新しい `resource` が追加された場合、次の三箇所を同じ変更単位で確認する。

1. `permission-matrix.ts` の安定表示順序
2. Portal の資源名及び Permission Code 名の日本語、中国語、英語辞書
3. 資源行の順序試験と三言語表示契約試験

## failure_or_correction

辞書にない資源は画面実装のフォールバックにより API の原文キーを表示する。Migration 037 の `inquiries.deleted` がこの経路へ入り、英語キーが画面へ露出した。専用辞書の追加で修正した。全量検査では、今回の変更範囲外で並行作業中のモデル設定バリデーションに対する旧テストが一件失敗した。

## candidate_skill

RBAC resource localization audit candidate。入力は Migration の Permission 定義と Portal の資源辞書、出力は未登録 resource の三言語差分一覧と対応テストとする。

## candidate_validator

Migration で `resource` を追加または変更した差分を検知し、`IdentityManagementPage.tsx` の三つの locale map、`permission-matrix.test.ts` の資源順序試験、UI 契約試験の更新有無を検査する。

## install_status

candidate only。正式 skill、validator、AGENTS.md は変更していない。

## evidence_paths

- `app/apps/portal-shell/src/permission-matrix.ts`
- `app/apps/portal-shell/src/IdentityManagementPage.tsx`
- `app/apps/portal-shell/src/permission-matrix.test.ts`
- `app/apps/portal-shell/src/auth-ui.test.ts`
- `app/db/migrations/037_add_inquiry_assist_run_ownership_and_soft_delete.sql`
- `docs/investigations/permission-matrix-terminology-20260807/evidence_index.md`
