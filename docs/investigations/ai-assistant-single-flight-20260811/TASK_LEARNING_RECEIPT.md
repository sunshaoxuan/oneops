# Task Learning Receipt

- task_type: AI Conversation の単一実行制御
- reusable_pattern: UI の全入口を共通状態で Lockし、Backend の PostgreSQL Row Lock と活動状態再確認で複数 Process の競合も原子的に閉じる
- failure_or_correction: HTTP Mutation の Pending だけでは非同期 Task の実行期間を表せず、2 件目の Task と SSE 購読切替によって回答対応が混在した
- candidate_skill: conversation-single-flight
- candidate_validator: frontend-entry-guard-and-backend-atomic-lock-validator
- install_status: candidate_only
- evidence_paths: `investigation_report.md`、`test_results.md`、`FINAL_ACCEPTANCE_CHECKLIST.md`
