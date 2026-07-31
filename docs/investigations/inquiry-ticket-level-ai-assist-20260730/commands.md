# 実行コマンド

```powershell
git fetch origin master
.\runtime\node\node.exe --test app\gateway\inquiry-support.test.mjs
.\runtime\node\pnpm.cmd --dir app --filter @one-ops/portal-shell test -- inquiry-support.test.ts
.\runtime\node\pnpm.cmd --dir app check
.\runtime\node\pnpm.cmd --dir app run publish
.\nginx.exe -t
curl.exe -sS -i http://127.0.0.1:8092/api/work-center/v1/health
curl.exe -k -sS -i https://192.168.20.54/api/work-center/v1/health
git diff --check
```

ブラウザー検証では公開済みの `https://192.168.20.54/inquiry-support` を開き、問合せ詳細、コンソール、スクリーンショットを確認する。
