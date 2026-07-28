# 実行コマンド

## 差分確認

```powershell
git fetch origin master
git rev-list --left-right --count origin/master...HEAD
git diff --check
```

## テスト

```powershell
$env:PATH="D:\nginx\runtime\node;$env:PATH"
pnpm --filter @one-ops/portal-shell test -- inquiry-support.test.ts
D:\nginx\runtime\node\node.exe --test gateway/inquiry-support.test.mjs
pnpm check
```

## 公開と稼働確認

```powershell
pnpm publish
D:\nginx\nginx.exe -t -p D:\nginx
```

Gateway のヘルス API、問合せ詳細、ブラウザーコンソール、保存済み履歴の表示位置を公開後に確認する。
