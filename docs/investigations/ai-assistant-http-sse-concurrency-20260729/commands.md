# 実行コマンド

## 読取調査

```powershell
rg -n -C 8 "busy|RUNNING|QUEUED|disabled|EventSource|/events|/tasks" app
Invoke-RestMethod http://127.0.0.1:8000/openapi.json
Get-NetTCPConnection -LocalPort 8000 -State Listen
rg -n -C 5 "ConversationBusyError" D:\workspace\cag\backend -g "*.py"
```

## 定向検証

```powershell
pnpm --filter @one-ops/portal-shell exec vitest run src/ai-assistant.test.ts
pnpm --filter @one-ops/portal-shell build
pnpm check
pnpm test:operations
powershell.exe -ExecutionPolicy Bypass -File .\scripts\publish-portal.ps1 -SkipChecks -Reason ai-assistant-http-sse-nonblocking
D:\nginx\nginx.exe -t -p D:\nginx
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
Invoke-WebRequest https://192.168.20.54/
git diff --check
```

CAG の変更、再起動、停止は実施していない。
