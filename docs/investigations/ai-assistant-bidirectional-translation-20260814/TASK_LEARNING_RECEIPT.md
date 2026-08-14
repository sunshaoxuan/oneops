# タスク学習回执

- task_type: 双方向翻訳の会話 Context 障害調査、修正、正式配信、Browser 受入
- reusable_pattern: Task Class と一般制約を継続し、方向は現在入力から再判定し、最終生成 Context は Turn 単位で隔離する
- failure_or_correction: Routing が正しくても Intent Analysis の履歴参照が最終出力方向を汚染する。Routing と Model Input を別々に検査する
- candidate_skill: bidirectional-translation-turn-isolation
- candidate_validator: shortcut-execution-context-and-response-history-validator
- install_status: candidate のみ。正式 Skill、Rule 又は Validator へ未導入
- evidence_paths: `investigation_report.md`、`evidence_index.md`、`test_results.md`、`FINAL_ACCEPTANCE_CHECKLIST.md`
