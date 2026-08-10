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

## CAG

```powershell
.\.venv\Scripts\python.exe -m pytest
D:\nginx\runtime\node\pnpm.cmd test
D:\nginx\runtime\node\pnpm.cmd build
git diff --check
```
