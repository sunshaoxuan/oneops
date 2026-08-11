# タスク学習記録

- task_type: `interruptible_ai_conversation`
- reusable_pattern: Composer の入力可否、Task 送信可否、添付可否を分離し、Stop は Server 所有権と Task 終端で閉じる。
- failure_or_correction: Composer 全体 Lock は利用者の次回 Draft 入力を妨げた。HTTP 202 だけで Send を復元すると Backend Task と画面状態が分離する。
- trigger_condition: 同じ Conversation の単一 Task 制御を維持しながら、生成中入力と明示 Stop を要求された場合。
- input: Session ID、最新 Task ID、Task Status、SSE Event、Session Draft。
- process: Session 所有権確認、Conversation 行 Lock、最新 Task 確認、CAG 所属確認、冪等 Cancel、SSE 終端確認、Draft と部分 Reply の保持。
- output: Task Cancel API、Stop Composer、Cancelled 表示、Gateway Audit、試験及び最終受入証拠。
- acceptance: 二重 Task 0、Cancel 対象 1、Cancelled Event 1、Draft 保持、Console Error 0、Warning 0。
- rollback: OneOps の Release Commit を Revertし、CAG Cancel API は未使用のまま残す。CAG を戻す場合は `v0.28.3` の Application Tree へ戻し、8002、8001、8000 の順で Rolling Restartする。
- candidate_skill: `interruptible-ai-composer-contract`
- candidate_validator: `ai-conversation-stop-acceptance`
- install_status: `candidate_only`
- evidence_paths: `investigation_report.md`、`test_results.md`、`FINAL_ACCEPTANCE_CHECKLIST.md`、`FINAL_RECEIPT.md`
