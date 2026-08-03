# 証跡インデックス

| ID | 証跡 | 内容 |
| --- | --- | --- |
| E-01 | `app/backend/src/main/java/jp/onehr/oneops/identity/application/IdentityService.java` | UUID 変換、ロール権限保存、利用者更新、変更権限と CSRF の共通境界 |
| E-02 | `app/backend/src/main/java/jp/onehr/oneops/masterdata/application/MasterDataService.java` | BIGINT 物理 ID 変換と組織更新 SQL 修正 |
| E-03 | `app/backend/src/main/java/jp/onehr/oneops/environment/application/EnvironmentService.java` | 環境領域の BIGINT 物理 ID 変換 |
| E-04 | `app/backend/src/test/java/jp/onehr/oneops/identity/web/RoleApiTest.java` | ロール API 契約と CSRF 拒否テスト |
| E-05 | `app/backend/src/test/java/jp/onehr/oneops/identity/application/RoleCrudDatabaseTest.java` | 実 PostgreSQL のロール CRUD と自動ロールバック |
| E-06 | `app/backend/src/test/java/jp/onehr/oneops/identity/application/ManagedUserCrudDatabaseTest.java` | 実 PostgreSQL の利用者更新とロール割当 |
| E-07 | `app/backend/src/test/java/jp/onehr/oneops/masterdata/application/MasterDataCrudDatabaseTest.java` | 実 PostgreSQL の基本台帳 CRUD |
| E-08 | `app/backend/src/test/java/jp/onehr/oneops/environment/application/EnvironmentCrudDatabaseTest.java` | 実 PostgreSQL の環境台帳と認証情報 CRUD |
| E-09 | `app/backend/target/surefire-reports` | Maven テスト結果 |
| E-10 | `app/logs/continuous-delivery.log` | 現場反映とヘルスチェック結果 |
