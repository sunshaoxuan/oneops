# 実行コマンド

```powershell
git fetch origin master
pnpm --filter @one-ops/portal-shell test
pnpm --filter @one-ops/portal-shell build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app\scripts\publish-portal.ps1 -Reason role-permission-matrix-final
git diff --check
```

ブラウザーでは最終ビルドの `/system-management/roles` を開き、ロール編集、権限セルの解除と復元、コンソール、スクリーンショットを確認しました。
