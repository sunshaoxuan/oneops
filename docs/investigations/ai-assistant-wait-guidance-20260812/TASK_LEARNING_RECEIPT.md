# TASK LEARNING RECEIPT

- task_type: AI 長時間待機の状態説明と判断支援
- reusable_pattern: 実 Task 作成時刻から即時計時し、正常実績に基づく閾値後だけ停止又は待機継続の案内を追加する
- failure_or_correction: Animation だけでは処理継続、経過時間、再試行判断を区別できない
- candidate_skill: AI Task Waiting Guidance
- candidate_validator: created_at 起点、30 秒境界、終端後 Loader 消失、重複再試行なし
- install_status: candidate only
- evidence_paths: `investigation_report.md`、`test_results.md`
