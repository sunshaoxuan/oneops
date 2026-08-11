# TASK LEARNING RECEIPT

- task_type: AI 待機 UI の簡素化と正式 Browser 検証
- reusable_pattern: 動作表示は一つの小型 Indicator と安定状態文言へ限定し、Reduced Motion では位置移動なしの明暗差分を連続 Frame で検証する
- failure_or_correction: 複数 Indicator と秒数は情報過多だった。Screenshot API は短い Page でも Timeout した
- candidate_skill: UI 簡素化の情報量 Gate と Screenshot 代替不可時の Evidence Missing 判定
- candidate_validator: Panel、Meter、秒数、複数 Loader の非存在を DOM と CSS で検査する
- install_status: candidate only
- evidence_paths: `investigation_report.md`、`FINAL_ACCEPTANCE_CHECKLIST.md`
