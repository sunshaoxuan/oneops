# 実行コマンド

```powershell
pnpm check
```

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\app\scripts\publish-portal.ps1 `
  -Reason ai-assistant-clipboard-files-v0.6.7
```

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8092/api/work-center/v1/health `
  -TimeoutSec 5
```

```powershell
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalPort -in 8000,8092,443 }
```

ブラウザー確認では `/ai-assistant` と `/inquiry-support` を使用し、クリップボード PNG 貼り付け、複数ファイル選択、CAG 送信、コンソール確認、スクリーンショット保存を実施した。
