# 実行コマンド

実行結果は `test_results.md` に記録する。

```powershell
node --test gateway/inquiry-support.test.mjs
pnpm check
git diff --check
Stop-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
Start-ScheduledTask -TaskName "OneHR Operations Compat Gateway"
```
