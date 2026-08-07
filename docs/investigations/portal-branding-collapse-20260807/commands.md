# 実行コマンド

## 基線確認

```text
git fetch origin master
git status --short
git rev-parse HEAD
git rev-parse origin/master
```

## テストとビルド

```text
D:\nginx\runtime\node\pnpm.cmd exec vitest run src/layout.test.ts
D:\nginx\runtime\node\pnpm.cmd test
D:\nginx\runtime\node\pnpm.cmd build
```

## 静的公開

```text
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -SkipChecks -SkipGatewayRestart -Reason portal-branding-collapse-20260807
```

## 実ページ確認

`https://192.168.20.54/` を正式画面として確認した。

1. 展開状態で HR ロゴ、OneOps、副題、主色及びコンソールを確認した。
2. `ナビゲーションを折りたたむ` を操作した。
3. 収縮状態で OneOps、HR ロゴの非表示、副題の非表示、`aria-expanded`、body 横幅及びコンソールを確認した。
4. 展開状態と収縮状態をそれぞれスクリーンショットへ保存した。
