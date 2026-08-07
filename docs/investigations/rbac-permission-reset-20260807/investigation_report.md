# ロール権限初期値の再適用防止 調査及び実装記録

## 目的

ロール編集画面で保存した権限集合が、Gateway 又はデータベースの再起動後に既定値へ戻る事象を調査し、全ての同種の初期権限処理を保存値と共存できる形へ統一する。

## 調査結果

1. PostgreSQL は `onehr-operations-postgres-data` という外部 Docker ボリュームを使用している。現在のコンテナはこのボリュームを `/var/lib/postgresql` へマウントしており、再起動時に空のデータベースへ切り替える構成ではない。
2. Windows タスク `OneHR Operations Compat Gateway` は `start-oneops-backend.ps1` を起動し、`OneOps Runtime Supervisor` は定期的に Gateway の稼働を確認する。これらの再起動処理は PostgreSQL のロール権限を直接更新しない。
3. `app/gateway/database.mjs` は Gateway 起動後の初回処理で `app/db/migrations` の SQL をファイル名順に再実行する。
4. 変更前の `009`、`013`、`014`、`016`、`019`、`022`、`025`、`026`、`034`、`036`、`037` は、既定ロールに対する `INSERT INTO role_permissions ... ON CONFLICT DO NOTHING` を含んでいた。リンクを削除しても、次回の SQL 再実行で同じリンクが追加される。
5. 現行データベースに対して `VIEWER` の `catalog.read` をトランザクション内で削除し、変更前の既定 SQL を再実行したところ、リンク件数は `0` から `1` へ戻った。検証トランザクションはロールバックした。

## 実装内容

`roles.permission_seed_enabled` 列を追加した。

- 初回作成時に SQL から投入される `SYSTEM_ADMIN`、`OPERATOR`、`VIEWER` だけを `true` とする。
- 既存ロール及び管理画面から作成したロールは `false` とする。
- 全ての初期権限 SQL に `permission_seed_enabled` 条件を追加した。
- Spring のロール保存と Node Gateway のロール保存は、既存ロールを更新した時点で `permission_seed_enabled = false` を保存する。
- 既存 PostgreSQL へ列を追加する際の既定値は `false` とし、現在の権限集合を変更しない。

これにより、ロール編集で確定した権限集合は、Gateway 再起動、Spring 再起動、PostgreSQL コンテナ再起動の後も保持される。新しい初期権限を既存の管理済みロールへ自動追加する処理も停止するため、権限分析時の基準が安定する。

## 対象ファイル

- `app/db/migrations/009_create_identity_and_rbac.sql`
- `app/db/migrations/013_create_environment_endpoint_credentials.sql`
- `app/db/migrations/014_create_ai_model_settings.sql`
- `app/db/migrations/016_create_inquiry_support.sql`
- `app/db/migrations/019_create_ai_assistant_sessions.sql`
- `app/db/migrations/022_create_personal_tasks.sql`
- `app/db/migrations/025_add_user_impersonation.sql`
- `app/db/migrations/026_create_internal_workforce_and_inquiry_search_policy.sql`
- `app/db/migrations/034_scoped_customer_ledger_extraction.sql`
- `app/db/migrations/036_add_portal_navigation_permissions.sql`
- `app/db/migrations/037_add_inquiry_assist_run_ownership_and_soft_delete.sql`
- `app/backend/src/main/java/jp/onehr/oneops/identity/application/IdentityService.java`
- `app/gateway/identity-database.mjs`
- `app/gateway/rbac-permission-seeding.test.mjs`
- `app/backend/src/test/java/jp/onehr/oneops/identity/application/RoleCrudDatabaseTest.java`
- `docs/AUTHENTICATION_AND_RBAC_REQUIREMENTS.md`
