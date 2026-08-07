# 検証結果

- Gateway と関連 Node テスト: 215 件成功。
- Portal テスト: 20 ファイル、168 件成功。
- Builder Python テスト: 14 件成功。
- Spring 通常試験: `mvnw.cmd -q test` 成功。
- Spring PostgreSQL 統合試験: `.env.local` から試験プロセスだけへ接続値を設定し、全試験を実行して成功。秘密情報は出力していない。
- RBAC DB 統合試験: `RoleCrudDatabaseTest` 3 件成功。保存後の `permission_seed_enabled = false` を実 DB で確認した。
- 実 DB 再実行確認: 保存済みロールの `permission_seed_enabled` は全て `false`。`VIEWER` の `catalog.read` をトランザクション内で削除して新条件の seed SQL を実行した結果、件数は `0` のまま。検証後にロールバックした。
- 実行環境: 8092 と 8093 の Health は `UP`。PostgreSQL コンテナは `onehr-operations-postgres-data` 外部ボリュームを使用している。
