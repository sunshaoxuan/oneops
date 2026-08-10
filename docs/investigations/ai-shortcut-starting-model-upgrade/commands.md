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
- `node --env-file=.env.local --input-type=module -e ...repository.migrate()...`
- `pnpm check`
- `mvnw.cmd test`
- `publish-portal.ps1 -SkipChecks -Reason ai-shortcut-model-picker-0.17.1`
- Browser で `https://192.168.20.54/` を開き、DOM、Console、認証状態を確認
- `git commit -m "feat: add hierarchical shortcut model settings"`
- `git push origin master`
- `vitest run src/ai-assistant-shortcuts.test.ts src/layout.test.ts`
- `pnpm check`
- `mvnw.cmd test`
- 正式 CSS Asset の Hover Trigger と Reduced Motion Selector を照合
- Browser で正式 HTTPS、Title、Windows Account 確認状態及び Console を確認
- `git commit -m "fix: animate shortcut only from new topic hover"`
- `git push origin master`
- OpenAI 公式 Release Notes で推理強度と速度表示の現行区分を再確認
- `rg -n "reasoning_effort|speed_level" D:\workspace\cag app`
- `node --test gateway/model-settings.test.mjs gateway/ai-assistant.test.mjs`
- `vitest run src/model-design.test.ts src/ai-assistant-shortcuts.test.ts`
- `git commit -m "fix: align shortcut reasoning and model discovery"`
- `git push origin master`

初回の手動 Publish は Nginx Global Event の権限拒否で失敗した。自動交付が 2026-08-10 15:13:15 に成功し、固定ポートと正式 Asset を更新した。

0.17.1 の手動追加 Publish も Nginx Global Event の権限拒否で失敗した。SYSTEM の常駐交付は 2026-08-10 15:30:36 に `delivery_succeeded` を記録した。正式 Health、HTTPS 及び配信 Asset を再確認し、手動失敗後も 0.17.1 が配信中であることを確認した。
