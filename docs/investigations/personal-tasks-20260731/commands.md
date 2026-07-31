# 個人タスク 0.7.0 検証コマンド

## 自動テストとビルド

```powershell
Set-Location D:\nginx\app
..\runtime\node\pnpm.cmd check
..\runtime\node\node.exe --test gateway/project-language.test.mjs
```

## Nginx 構成

```powershell
Set-Location D:\nginx
.\nginx.exe -t -p D:\nginx\ -c conf\nginx.conf
```

## 正式公開

```powershell
Set-Location D:\nginx\app
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File scripts\publish-portal.ps1 `
  -SkipChecks `
  -Reason personal-tasks-backlog-error-tests
```

## リモート差分

```powershell
Set-Location D:\nginx
git fetch origin master
git rev-list --left-right --count HEAD...origin/master
```

データベース接続値、資格情報、セッション Cookie および暗号化データは記録対象外とした。
