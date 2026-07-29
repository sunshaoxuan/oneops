# 実行コマンド

```powershell
git fetch origin master
pnpm --filter @one-ops/portal-shell test
pnpm --filter @one-ops/portal-shell build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app\scripts\publish-portal.ps1 -Reason role-permission-matrix-usability
git diff --check
```

ブラウザーでは日本語セッションへ中国語の権限・組込みロール原文を返す受入フィクスチャを接続し、可視言語、列座標、権限操作、コンソール、スクリーンショットを検証しました。
