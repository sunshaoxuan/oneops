# 証跡索引

| 証跡 | パスまたは確認対象 |
| --- | --- |
| 常時稼働仕様 | `docs/RUNTIME_AVAILABILITY.md` |
| 一回復旧 | `app/scripts/ensure-oneops-runtime.ps1` |
| 常駐監視 | `app/scripts/watch-oneops-runtime.ps1` |
| タスク登録 | `app/scripts/install-runtime-supervisor.ps1` |
| 運用スクリプトテスト | `app/scripts/test-operations-scripts.ps1` |
| ブラウザー画像 | `docs/evidence/runtime-supervisor-sso-0.5.1.png` |
| 実行ログ | `D:\nginx\app\logs\runtime-supervisor.log` |
| Windows タスク | `OneOps Runtime Supervisor` |
| PostgreSQL 外部ボリューム | `onehr-operations-postgres-data` |

ランタイムログ、環境ファイル、データベース内容は Git 管理対象外です。調査報告とテスト結果には秘密情報を含まない確認値だけを記録します。
