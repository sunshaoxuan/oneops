# 実行記録

実施日: 2026-07-30

```powershell
git fetch origin master
$env:PATH="D:\nginx\runtime\node;$env:PATH"
pnpm.cmd --filter @one-ops/portal-shell test -- inquiry-support.test.ts
pnpm.cmd check
pnpm.cmd test:operations
pnpm.cmd run publish
```

ブラウザーでは `https://192.168.20.54/inquiry-support` を開き、OPEN 検索、初期並べ替え、問合せ No. の昇順と降順、Console、画面版数を確認した。
