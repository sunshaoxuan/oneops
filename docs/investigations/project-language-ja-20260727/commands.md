# 実行コマンド

```powershell
D:\nginx\runtime\node\node.exe --test D:\nginx\app\gateway\project-language.test.mjs
D:\nginx\runtime\node\pnpm.cmd check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -AppRoot D:\nginx\app -Reason project-language-ja-20260727
git diff --check
git push origin master
git push origin v0.2.1
```

DOCX の構造検査はタスク専用一時ディレクトリ内の検証スクリプトで実行し、完了後に一時ファイルを削除する。
