# 実行コマンド記録

1. `git fetch origin`
2. `pnpm --filter @one-ops/portal-shell test -- src/inquiry-support.test.ts`
3. `pnpm --filter @one-ops/portal-shell build`
4. `pnpm check`
5. `app/backend/mvnw.cmd test`
6. `git diff --check`
7. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File app/scripts/publish-portal.ps1 -Reason inquiry-ai-deleted-history-icons-v0.15.8`
8. `GET http://127.0.0.1:8092/api/work-center/v1/health`
9. 管理者 Browser で問合 No. 94056 の削除済み履歴三件を確認
10. Browser Console の error、warn、warning を確認

最初の配信試行は `pwsh` の Mutex Constructor 差異により Runtime 変更前に終了した。Windows PowerShell で再実行し、正式配信に成功した。
