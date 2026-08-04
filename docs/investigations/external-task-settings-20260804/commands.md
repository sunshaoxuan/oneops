# 実行コマンド記録

## 調査

- `rg` による問合設定、Backlog 接続、Model 用途、権限、監査経路の確認
- Backlog Developer API 公式認証資料の確認
- PostgreSQL Schema の列と制約確認

## 試験

- `node --test gateway/external-task-settings.test.mjs gateway/model-settings.test.mjs gateway/inquiry-support.test.mjs gateway/operation-audit.test.mjs`
- `pnpm --filter @one-ops/portal-shell test`
- `pnpm --filter @one-ops/portal-shell build`
- `pnpm check`
- `mvnw.cmd test`
- `mvnw.cmd package -DskipTests`

## 公開確認

- `publish-portal.ps1 -SkipChecks -Reason external-task-settings-0.9.0`
- `nginx.exe -t`
- Backend と Legacy Gateway Health
- HTTPS トップページ HTTP 200 と Hash Asset 確認
