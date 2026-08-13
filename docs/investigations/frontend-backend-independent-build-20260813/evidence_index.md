# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| エラー原因 | `validate_job_payload()` の旧 AND 条件 | 高 | 修正前ソースと画面エラー |
| リモートは独立対象に対応 | `droneci/build-console/server.py` の `build_backend` と `build_web_package` | 高 | 原始コード確認 |
| 前端単独を受理 | `test_standard_release_accepts_independent_frontend_or_backend_targets` | 高 | Runtime 画面確認を追加予定 |
| 後端単独を受理 | 同上 | 高 | Runtime API 契約確認を追加予定 |
| 単一 ZIP を交付 | `test_standard_release_copies_only_selected_artifacts` | 高 | 隔離実ファイル検証 |
| 両方空を拒否 | 同 validation test | 高 | `missing build target` 維持 |
