# 最終受入一覧

| 受入項目 | 成果物 | 検証証拠 | 判定 |
| --- | --- | --- | --- |
| 保存済みロール権限を初期 SQL が再追加しない | `009` と後続 10 migration の `permission_seed_enabled` 条件 | Gateway 静的テスト 2 件、全 Gateway テスト 215 件成功 | 合格 |
| Spring 保存で既存ロールを管理済み状態へ固定する | `IdentityService.saveRole` | Spring DB 統合試験 `RoleCrudDatabaseTest` 3 件成功 | 合格 |
| Node Gateway 保存でも同じ状態遷移を行う | `identity-database.mjs` | Gateway 静的ソース検査 | 合格 |
| 既存 PostgreSQL の権限集合を変更せず列だけ追加する | `ALTER TABLE ... DEFAULT false` | 実 DB のロール権限件数 `OPERATOR=16`、`SYSTEM_ADMIN=32`、`VIEWER=12` | 合格 |
| 再起動後もサービスが稼働する | 8092 Spring、8093 Node | 両ポートの Health が `UP` | 合格 |
| 外部永続ボリュームを維持する | `app/compose.yaml` | Docker volume inspect とコンテナ Mounts の確認 | 合格 |
| 既存機能に回帰がない | Gateway、Portal、Builder、Spring | Gateway 215 件、Portal 168 件、Builder 14 件、Spring 通常試験及び DB 統合試験成功 | 合格 |
| 要件と運用説明を更新する | RBAC 要件文書、調査記録 | `AUTHENTICATION_AND_RBAC_REQUIREMENTS.md` と本記録 | 合格 |
