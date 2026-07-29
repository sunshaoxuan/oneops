# 実行コマンド

## 調査

```powershell
git fetch origin master
git status --short
rg -n "タスクセンター|AiAssistantChat|ai.assistant" app docs
```

## テスト

```powershell
pnpm --filter @one-ops/portal-shell exec vitest run src/ai-assistant.test.ts src/portal-navigation.test.ts src/permission-matrix.test.ts src/auth-ui.test.ts src/layout.test.ts
pnpm --filter @one-ops/portal-shell build
pnpm check
pnpm test:operations
git diff --check
```

## 公開

```powershell
powershell.exe -File D:\nginx\app\scripts\publish-portal.ps1 -SkipChecks -Reason ai-assistant-full-page
D:\nginx\nginx.exe -t -p D:\nginx
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
Invoke-WebRequest https://192.168.20.54/
Get-NetTCPConnection -LocalPort 8000 -State Listen
```

CAG の変更、再起動、停止は実施していない。
