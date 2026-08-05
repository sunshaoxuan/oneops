# タスク学習記録

| 項目 | 内容 |
| --- | --- |
| task_type | 共有変更が存在する OneOps での顧客情報統合、Database、API、UI、Browser 受入 |
| reusable_pattern | 共有主作業区を保持し、最新 `origin/master` から detached Worktree を作成して実装、試験、Browser 受入を隔離する |
| failure_or_correction | 基線更新後に他タスクの変更を混入させない。正式配信前に主作業区の在途変更と版数境界を再確認する |
| candidate_skill | detached Worktree による共有汚染作業区の隔離実装及び受入手順 |
| candidate_validator | Worktree 基線、変更所有、正式配信対象、HEAD と `origin/master` の一致を確認する Validator |
| install_status | Candidate のみ。正式 Skill 又は Validator へ未導入 |
| evidence_paths | `investigation_report.md`、`evidence_index.md`、`test_results.md`、`FINAL_RECEIPT.md` |

## 受入方式

候補は、同一 Repository の主作業区に別タスクの未コミット変更があり、変更対象又は版数が重なる可能性がある場合に使用する。入力は Repository、正式 Branch、既存変更一覧、今回の変更範囲、試験及び配信要件とする。

出力は隔離 Worktree、基線 Commit、変更一覧、試験証拠、Browser 証拠、配信可否判定である。正式配信前に最新 `origin/master` へ同期し、全試験と最終受入を先頭から再実行する。中止時は隔離 Worktree と一時成果物を削除し、主作業区へ変更を持ち込まない。
