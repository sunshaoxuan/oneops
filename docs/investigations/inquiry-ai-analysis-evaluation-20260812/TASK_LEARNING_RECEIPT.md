# タスク学習回付

- task_type: LLM 分析 Human Feedback の End To End 実装及び正式受入
- reusable_pattern: Run 物理 ID と Evaluator 物理 ID の一意評価、二値 Score、自由記述、Upsert、認証主体固定、操作監査、再読込回填
- failure_or_correction: Release Version 一致試験は最初の不足 File だけを報告するため、Version Marker 一覧を先に抽出して一括同期する。正式 HTTPS は `localhost` ではなく Nginx の実 Listen Address を使用する。
- candidate_skill: `llm-run-human-feedback-e2e`
- candidate_validator: 評価 Table の FK、Check、Unique、UI 回填、Audit、Browser、Console、Screenshot を一括検証する Validator
- install_status: candidate_only
- evidence_paths: `docs/investigations/inquiry-ai-analysis-evaluation-20260812`、本機受入 Screenshot
