# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
| --- | --- | --- | --- |
| OneOps の HTTP 主体は Node.js Gateway | `app/gateway/server.mjs:1-110`, `app/gateway/server.mjs:2366` | 高 | 実行中プロセスの完全なコマンドラインは未取得 |
| Gateway は内部 Python Worker を起動する | `app/gateway/server.mjs:108-110`, `app/gateway/server.mjs:275-297`, `app/gateway/builder-worker.mjs:35-90` | 高 | Worker 内部の全処理は対象外 |
| 環境更新にはトランザクションがある | `app/gateway/environment-database.mjs:175-184`, `:736-868` | 高 | すべての環境関連操作が同一境界ではない |
| Identity 更新には行ロックとトランザクションがある | `app/gateway/identity-database.mjs:44-52`, `:103-140`, `:575-615` | 高 | 監査処理は HTTP Controller 側で別操作 |
| 個人タスク同期は Advisory Lock を使用する | `app/gateway/personal-task-database.mjs:645-733` | 高 | 候補 upsert は項目単位の確定 |
| Repository Pool は複数存在する | `app/gateway/database.mjs:38-44`, `environment-database.mjs:339-345`, `identity-database.mjs:93-99`, `personal-task-database.mjs:204-210`、他 4 Repository | 高 | 実際の同時接続数は負荷に依存 |
| プロセス内状態が存在する | `app/gateway/auth-controller.mjs:145-157`, `app/gateway/auth.mjs:333`, `app/gateway/server.mjs:306-383`, `:2376-2396` | 高 | Redis 等の外部共有状態は今回のコード調査対象外 |
| 起動時に SQL マイグレーションを実行する | `app/gateway/server.mjs:312-321`, `app/gateway/database.mjs:52-60` | 高 | DB 実行時の同時起動ログは未取得 |
| 監査失敗を業務更新と分離する | `app/gateway/auth-controller.mjs:168-170`, `:649-699`, `:750-770` | 高 | 監査 DB の可用性試験は未実施 |
| `spring_boot_version` は成果物メタデータの読み取り | `app/builder/standalone_packager.py:343-355` | 高 | OneOps 外の成果物内容は個別検証していない |
