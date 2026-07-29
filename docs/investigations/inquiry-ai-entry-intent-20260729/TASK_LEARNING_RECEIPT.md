# タスク学習記録

## task_type

UI 操作位置と生成 AI Prompt 意図の整合

## reusable_pattern

画面操作が同じ AI 機能を異なる目的で起動する場合、表示文言、アクセシブル名称、API の位置種別、保存履歴、Prompt の優先指示を同じ識別子で連結する。

## failure_or_correction

位置種別を API と履歴へ保存していても、AI 実行サービスが重点メッセージだけを参照すると、顧客質問と返信品質の意図差が Prompt で失われる。

## candidate_skill

`ui-ai-action-intent-trace`

## candidate_validator

各位置種別について、画面文言、API payload、Prompt 内の位置、位置別の優先指示を検査する。

## install_status

candidate

## evidence_paths

1. `app/apps/portal-shell/src/InquirySupportPage.tsx`
2. `app/gateway/inquiry-analysis.mjs`
3. `app/apps/portal-shell/src/inquiry-support.test.ts`
4. `app/gateway/inquiry-support.test.mjs`
5. `docs/investigations/inquiry-ai-entry-intent-20260729/investigation_report.md`
