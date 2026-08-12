# 実行記録

1. `git fetch origin master --prune`
2. `node --test gateway/model-settings.test.mjs`
3. `pnpm --filter @one-ops/portal-shell test -- src/model-design.test.ts`
4. `git diff --check -- app/gateway/model-settings.mjs app/gateway/model-settings.test.mjs docs/AI_SETTINGS_REQUIREMENTS.md CHANGELOG.md`
5. `node --env-file=.env.local --input-type=module` で Database Migration を実行
6. `pnpm build`
7. Browser で `https://192.168.20.54` を開き、Windows SSO 待機画面を確認。認証済み設定画面へ到達できず、保存、Console、Screenshot は `evidence_missing`。

8. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File app/scripts/publish-portal.ps1`
9. `Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health`
10. `Invoke-RestMethod http://127.0.0.1:8093/api/work-center/v1/health`
11. `git rev-parse HEAD` と `git rev-parse origin/master` の一致確認

全量試験、配信及び Git 配信は合格した。認証済み AI 設定画面の Browser 保存、Console 及び Screenshot は `evidence_missing` とする。
