# タスク学習記録

- task_type: `interruptible_ai_conversation`
- reusable_pattern: Composer の入力可否、Task 送信可否、添付可否を分離し、Stop は Session ID、Task ID、試行 ID の組、Server 所有権、背景 SSE 及び Task 終端で閉じる。
- failure_or_correction: Composer 全体 Lock は利用者の次回 Draft 入力を妨げた。HTTP 202 又は詳細照会の終端だけで Send を復元すると Backend Task と画面状態が分離する。選択中 Session だけの SSE は Session 切替中の停止終端を取り逃がす可能性がある。
- trigger_condition: 同じ Conversation の単一 Task 制御を維持しながら、生成中入力と明示 Stop を要求された場合。
- input: Session ID、最新 Task ID、Task Status、SSE Event、Session Draft。
- process: Session 所有権確認、Conversation 行 Lock、最新 Task 確認、CAG 所属確認、冪等 Cancel、Session と Task ごとの背景 SSE、試行 ID 確認、終端 Reply 照合、Draft と部分 Reply の保持。
- output: Task Cancel API、Stop Composer、背景 Stop SSE、Cancelled 表示、Session 単位 Error、Gateway Audit、試験及び最終受入証拠。
- acceptance: 二重 Task 0、Cancel 対象 1、Cancelled Event 1、古い Callback 適用 0、不一致 Event 適用 0、Draft 保持、Console Error 0、Warning 0。
- rollback: OneOps の Release Commit を Revertし、CAG Cancel API は未使用のまま残す。CAG を戻す場合は `v0.28.3` の Application Tree へ戻し、8002、8001、8000 の順で Rolling Restartする。
- candidate_skill: `interruptible-ai-composer-contract`
- candidate_validator: `ai-conversation-stop-acceptance`
- install_status: `candidate_only`
- validation_result: CAG 全試験、Runtime Cancel、OneOps 最初の全量 Check、正式 Runtime、返工後 Gateway 279 件、Worker 14 件、Portal 219 件、Production Build、Operations 9 Script及び Spring 40 件中8件 Skipが合格。正式再配信、認証後 Browser、Console、Screenshot は待検証。
- browser_coverage: Application 内 Browser は正式 URL のローカル Login 画面まで到達。認証後 Composer、Stop、Network、Console、Screenshot は `evidence_missing`。
- evidence_paths: `investigation_report.md`、`test_results.md`、`FINAL_ACCEPTANCE_CHECKLIST.md`、`FINAL_RECEIPT.md`、`D:\workspace\codex-selfimp\outputs\ai-assistant-interruptible-composer-20260811`
