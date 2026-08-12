# タスク学習回执

- task_type: 外部 API 設定と同期の障害調査及び修正
- reusable_pattern: 外部 API の表示用 Key と検索用物理 ID を区別し、Options から選択して保存時と実行時の両境界で検証する
- failure_or_correction: 自由入力のプロジェクト Key を Number 契約の `projectId[]` へ送信し、HTTP 400 を発生させた
- candidate_skill: なし。既存 `engineering-investigation-evidence` で処理可能
- candidate_validator: 外部検索条件の物理 ID 型と Options 由来値を確認する Validator
- install_status: 未安装。候補評価のみ
- evidence_paths: `docs/investigations/backlog-personal-task-stability-20260812`
