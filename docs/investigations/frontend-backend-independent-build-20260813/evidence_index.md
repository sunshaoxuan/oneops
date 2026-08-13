# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| エラー原因 | `validate_job_payload()` の旧 AND 条件 | 高 | 修正前ソースと画面エラー |
| リモートは独立対象に対応 | `droneci/build-console/server.py` の `build_backend` と `build_web_package` | 高 | 原始コード確認 |
| 前端単独を受理 | task `20260813185018`、`build_backend=False`、`build_frontend=True`、`build_web_package=True` | 高 | Runtime 成功を確認 |
| 後端単独を受理 | task `20260813190156`、`build_backend=True`、`build_frontend=False`、`build_web_package=False` | 高 | Runtime 成功を確認 |
| 単一 ZIP を交付 | `標準発版 20260813185018/web.zip` と `標準発版 20260813190156/package.zip` | 高 | 実交付ディレクトリを確認 |
| 両方空を拒否 | 同 validation test | 高 | `missing build target` 維持 |
| Browser Console | error 0 件、warning 0 件 | 高 | 構築前と両タスク成功後に確認 |
| Runtime Screenshot | `docs/evidence/*-only-standard-release-success-20260813.png` | 高 | 前端と後端の成功履歴を保存 |
