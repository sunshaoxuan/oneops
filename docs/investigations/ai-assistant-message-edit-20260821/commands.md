# 実行コマンド

```powershell
pnpm --dir app --filter @one-ops/portal-shell exec vitest run src/ai-assistant-interaction-style.test.ts src/ai-assistant-resubmit.test.ts
node --test app/gateway/ai-assistant.test.mjs app/gateway/ai-assistant-attachments.test.mjs app/gateway/ai-assistant-database.test.mjs
pnpm --dir app check
.\nginx.exe -t -p D:\nginx
```

Browser 受入では、隔離済みの公開 Snapshot を `publish-portal.ps1` で公開し、`https://192.168.20.54/` を使用する。
