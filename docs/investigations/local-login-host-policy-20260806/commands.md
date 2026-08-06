# 実行コマンド

```powershell
git fetch origin master --prune
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\ensure-oneops-runtime.ps1 -AppRoot D:\nginx\app -SelfTest
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\test-operations-scripts.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\ensure-oneops-runtime.ps1 -AppRoot D:\nginx\app
D:\nginx\runtime\node\pnpm.cmd check
D:\nginx\app\backend\mvnw.cmd test
```

Browser では正式 URL `https://192.168.20.54/`、`/customers`、組織機関 `9330`、ナレッジスキャン、Console、Screenshot を確認した。
