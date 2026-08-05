# 実行コマンド記録

## リポジトリ確認

```powershell
git fetch origin master
git status --short
git rev-parse HEAD
git rev-parse origin/master
```

## 自動試験と Build

```powershell
Set-Location D:\nginx\app
& D:\nginx\runtime\node\pnpm.cmd check

Set-Location D:\nginx\app\backend
.\mvnw.cmd test
```

## 正式配信確認

```powershell
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
Invoke-WebRequest https://192.168.20.54/ -SkipCertificateCheck
Get-Content -Tail 30 D:\nginx\app\logs\continuous-delivery.log
```

## 利用者識別 UI 配信

```powershell
Set-Location D:\nginx
& D:\nginx\app\scripts\publish-portal.ps1 `
  -SkipChecks `
  -SkipGatewayRestart `
  -Reason user-editor-identification-0.9.2
```

事前の `pnpm check` で全自動試験と Production Build を完了したため、配信処理では同じ Check の重複実行を省略した。

## Browser 受入

正式 Browser への制御接続は `Transport closed` で中断した。接続復旧後に利用者一覧、編集 Select、編集対象識別領域、Console、Layout 及び Screenshot を確認する。
