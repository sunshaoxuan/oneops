# タスク学習受領記録

- task_type: AI Conversation の単一実行制御
- reusable_pattern: UI の全入口を共通状態で Lockし、Backend の PostgreSQL Row Lock と活動状態再確認で複数 Process の競合も原子的に閉じる
- failure_or_correction: HTTP Mutation の Pending だけでは非同期 Task の実行期間を表せず、2 件目の Task と SSE 購読切替によって回答対応が混在した
- candidate_skill: conversation-single-flight
- candidate_validator: frontend-entry-guard-and-backend-atomic-lock-validator
- install_status: candidate_only
- validation_result: Portal、Gateway、Database、個人タスク、正式 Runtime、Browser、Console 及び Screenshot の全受入項目が合格
- acceptance_pattern: 実行中 Lock、別 Conversation 独立、既存 Task 継続、終端復元を同じ正式 Conversation で連続確認する
- browser_coverage: TextArea、送信、添付 Button、File Input の Disabled 状態と Fill、Enter を直接確認し、Paste、Drag and Drop 及び添付 Event の Guard は Portal Test で確認した
- rollback: 対象 Commit を Revertし、Frontend Guard、Backend Lock、Business Code、Test 及び正式要件を同時に直前契約へ戻す
- evidence_paths: `investigation_report.md`、`evidence_index.md`、`test_results.md`、`FINAL_ACCEPTANCE_CHECKLIST.md`、`FINAL_RECEIPT.md`、`single-flight-locked-0.18.16.png`、`single-flight-terminal-0.18.16.png`
