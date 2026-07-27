# 调查与验证命令

在 `D:\nginx\app` 执行：

```powershell
$env:PATH="D:\nginx\runtime\node;$env:PATH"
..\runtime\node\node.exe --test gateway/inquiry-support.test.mjs gateway/auth.test.mjs
pnpm --filter @one-ops/portal-shell test
pnpm check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\publish-portal.ps1 -Reason inquiry-support
```

在 `D:\nginx` 执行：

```powershell
.\nginx.exe -t
```

健康检查：

```powershell
Invoke-RestMethod https://localhost/api/work-center/v1/health
```
