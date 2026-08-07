# 実行コマンド記録

1. `git fetch origin`
2. `pnpm --filter @one-ops/portal-shell test`
3. `pnpm --filter @one-ops/portal-shell build`
4. `pnpm check`
5. `app/backend/mvnw.cmd test`
6. `pnpm test:operations`
7. `git diff --check`
8. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File app/scripts/publish-portal.ps1 -Reason ai-assistant-generic-user-copy-v0.15.9`
9. 正式 Browser で `/ai-assistant` の空状態、表示語及び Console を確認

最初の全試験では Spring Package 作成と運用 Script 試験を並列実行し、同一 Rolling JAR の削除競合が発生した。正式処理順序に合わせて直列再実行し、全項目に合格した。
