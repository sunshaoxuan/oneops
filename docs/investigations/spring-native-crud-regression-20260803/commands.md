# 実行コマンド記録

機密値は記録しない。

## 原因再現

1. 正式データベースから VIEWER の物理 ID と権限件数を読み取り専用で取得した。
2. Spring `IdentityService.saveRole` を正式 PostgreSQL トランザクション内で実行し、処理終了時に強制ロールバックした。
3. 修正前は `uuid = character varying` を再現し、修正後はトランザクション内で権限 2 件、ロールバック後に元の 7 件を確認した。

## テスト

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot'
.\mvnw.cmd -q test
.\mvnw.cmd -q '-Dtest=RoleCrudDatabaseTest,ManagedUserCrudDatabaseTest,MasterDataCrudDatabaseTest,EnvironmentCrudDatabaseTest' test
```

実 PostgreSQL テストでは `.env.local` をプロセス環境へ読み込み、`ONEOPS_DATABASE_INTEGRATION_TEST=true` と `ONEOPS_LEGACY_GATEWAY_ENABLED=false` を指定した。接続文字列、利用者名、パスワード、暗号鍵は出力していない。
