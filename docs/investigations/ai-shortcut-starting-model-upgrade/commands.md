# 実行コマンド記録

## 2026-08-10

- `git status --short`
- `git branch --show-current`
- `git rev-parse HEAD`
- `git rev-parse origin/master`
- `git fetch origin master`
- `rg -n "SIMPLE|GENERAL|INQUIRY|model settings|modelSettings|purpose|latency" ...`
- `node --test gateway/model-settings.test.mjs gateway/ai-assistant-routing.test.mjs gateway/ai-assistant.test.mjs`
- `pnpm --filter @one-ops/portal-shell test`
- `pnpm check`
- `mvnw.cmd test`
- `docker exec onehr-operations-postgres psql ...`
- `publish-portal.ps1 -SkipChecks -Reason ai-shortcut-starting-model-upgrade-0.17.0`
- `curl http://127.0.0.1:8092/api/work-center/v1/health`
- `curl -k https://192.168.20.54/`

初回の手動 Publish は Nginx Global Event の権限拒否で失敗した。自動交付が 2026-08-10 15:13:15 に成功し、固定ポートと正式 Asset を更新した。
