# 実行コマンド

## OneOps

```powershell
D:\nginx\runtime\node\pnpm.cmd install --frozen-lockfile
D:\nginx\runtime\node\node.exe --test gateway/*.test.mjs scripts/provision-ai-assistant-routing-models.test.mjs
D:\nginx\runtime\python\python.exe -m unittest builder/oneops_worker_test.py
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
cd backend
.\mvnw.cmd test
git diff --check
```

## 正式 Runtime

```powershell
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
.\scripts\manage-local-codex-gateway-task.ps1 start -Port 8001 -TaskName "CAG Local Codex Gateway Backup"
.\scripts\manage-local-codex-gateway-task.ps1 start -Port 8002 -TaskName "CAG Local Codex Gateway Standby"
Invoke-RestMethod http://127.0.0.1:8001/health/ready
Invoke-RestMethod http://127.0.0.1:8002/health/ready
```

## CAG

```powershell
.\.venv\Scripts\python.exe -m pytest
D:\nginx\runtime\node\pnpm.cmd test
D:\nginx\runtime\node\pnpm.cmd build
git diff --check
```
