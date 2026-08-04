# 実行コマンド

1. `mvnw.cmd -Dtest=AuthControllerConfigTest,RoleApiTest test`
2. `node.exe --test gateway/auth-controller.test.mjs`
3. `scripts/test-operations-scripts.ps1`
4. `pnpm.cmd check`
5. `mvnw.cmd test`
6. `ONEOPS_DATABASE_INTEGRATION_TEST=true` を設定した `mvnw.cmd test`
7. `mvnw.cmd -DskipTests package`
8. `scripts/publish-portal.ps1 -SkipChecks -Reason spring-sso-config-contract-0.8.7`
9. `scripts/install-runtime-supervisor.ps1 -AppRoot D:\nginx\app`
10. 認証設定 API、health、HTTPS、Nginx、Windows タスク、ブラウザー表示とコンソールの確認
