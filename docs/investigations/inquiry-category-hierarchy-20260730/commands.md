# 実行コマンド

実行結果は `test_results.md` と `FINAL_RECEIPT.md` に記録する。

```powershell
$env:Path = 'D:\nginx\runtime\node;' + $env:Path
pnpm --filter @one-ops/portal-shell test
pnpm --filter @one-ops/portal-shell build
pnpm check
pnpm run publish
D:\nginx\nginx.exe -t -p D:\nginx
```
