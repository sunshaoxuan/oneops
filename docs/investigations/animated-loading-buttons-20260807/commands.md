# 実行コマンド記録

```powershell
git fetch origin master
Invoke-WebRequest https://loader-buttons.appllama.io/
Invoke-WebRequest https://loader-buttons.appllama.io/LICENSE
Invoke-WebRequest https://loader-buttons.appllama.io/README.md
Invoke-WebRequest https://loader-buttons.appllama.io/src/main.js
Invoke-WebRequest https://loader-buttons.appllama.io/src/designs/index.js
D:\nginx\runtime\node\pnpm.cmd install --lockfile-only
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
git diff --check
```

ブラウザーでは `/ui/loader-buttons` を開き、DOM 件数、variant ID、描画要素、横幅、Console、desktop screenshot、mobile screenshot 及び 300ms 間隔の frame screenshot hash を確認した。
