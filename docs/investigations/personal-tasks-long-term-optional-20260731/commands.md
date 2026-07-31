# 個人タスク長期発動条件 検証コマンド

```powershell
cd D:\nginx\app
& D:\nginx\runtime\node\node.exe --test gateway/personal-task.test.mjs
& D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test -- personal-tasks.test.ts layout.test.ts
& D:\nginx\runtime\node\pnpm.cmd build
& D:\nginx\runtime\node\node.exe --env-file=.env.local --input-type=module -e '... migrate and rollback verification ...'
```

正式公開後に `nginx -t`、Gateway health、ブラウザー画面、コンソール、ネットワーク、スクリーンショットを追加確認します。
