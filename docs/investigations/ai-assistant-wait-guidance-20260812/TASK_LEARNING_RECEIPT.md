# TASK LEARNING RECEIPT

- task_type: AI 長時間待機の状態説明と判断支援
- reusable_pattern: 実 Task 作成時刻から即時計時し、正常実績に基づく閾値後だけ停止又は待機継続を案内する。回答本文のない末尾 Failed Task には利用者起点の一回再送信を提供する
- failure_or_correction: Animation と待機案内だけでは失敗終端後に同じ質問を回復する操作が不足する
- candidate_skill: AI Task Waiting Guidance
- candidate_validator: created_at 起点、30 秒境界、終端後 Loader 消失、末尾 Failed 限定、保存済み入力再利用、実行中重複送信なし
- install_status: candidate only
- evidence_paths: `investigation_report.md`、`test_results.md`
