# テスト結果

更新日: 2026-08-03

## 再現結果

- 修正前のロール更新: `BadSqlGrammarException`
- PostgreSQL 原因: `operator does not exist: uuid = character varying`
- 修正前後の VIEWER 権限件数: 7 件から変更なし

## 修正後のロール検証

- 正式 PostgreSQL トランザクション内の権限件数: 2 件
- `saveRole` 応答: `dashboard.read`、`organizations.read`
- 自動ロールバック後の VIEWER 権限件数: 7 件

## 自動テスト

- `IdentityServiceTest`: 5 件成功
- `RoleApiTest`: 4 件成功
- `RoleCrudDatabaseTest`: 2 件成功
- `ManagedUserCrudDatabaseTest`: 1 件成功
- `MasterDataCrudDatabaseTest`: 1 件成功
- `EnvironmentCrudDatabaseTest`: 1 件成功
- その他 Spring テスト: 5 件成功
- Spring 合計: 19 件成功

## データ残留確認

- `CRUD_%` と `ENV_CRUD_%` のロール、組織区分、組織、製品: 0 件
- ロール: 3 件
- ロール権限: 39 件
- 利用者: 12 件
- 利用者ロール割当: 12 件
- 組織: 106 件
- 環境: 4 件
- 製品: 12 件
