# 実行コマンド

```powershell
pnpm --filter @one-ops/portal-shell test
pnpm check
powershell -NoProfile -ExecutionPolicy Bypass -File .\app\scripts\publish-portal.ps1 -Reason ai-assistant-quick-navigation-v0.6.8
git diff --check
nginx -t
```

ブラウザでは `https://192.168.20.54/ai-assistant` と `https://192.168.20.54/inquiry-support` を再読込し、DOM、表示、スクロール位置、横幅、コンソールを確認した。
