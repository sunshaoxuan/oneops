# タスク学習回执

- task_type: 既存摘要 API と Home UI の件数追加
- reusable_pattern: 詳細画面の既存分類条件を摘要 SQL と共有型へ同じ境界で追加し、概要カードを対応画面へ関連付ける
- failure_or_correction: システム PATH の Node を使用せず、プロジェクト同梱 Runtime を使用する。並行 Vitest が多数存在する場合は Worker 資源解放後に再実行する
- candidate_skill: なし。既存の工程調査と証跡 skill で処理可能
- candidate_validator: なし。既存 Gateway、Portal、Build、Browser の検証で受入可能
- install_status: 対象なし
- evidence_paths: `docs/investigations/home-scheduled-task-summary-20260814`
