# 実行コマンド

## ソース同期確認

```powershell
git fetch origin master --tags
git rev-list --left-right --count origin/master...HEAD
git status --short
```

## 自動テストとビルド

```powershell
pnpm check
```

## 公開

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -AppRoot D:\nginx\app -SkipChecks -Reason inquiry-ai-hide-empty-v0.2.7
```

## リリース後確認

公開スクリプトによる nginx 構文確認、Gateway 健全性確認、HTTPS 画面確認を実施した。Chrome のログ取得で error、warning、warn が 0 件であることを確認した。
