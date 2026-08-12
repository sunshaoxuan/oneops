# 実行 Command

```powershell
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test -- home-labels.test.ts auth-ui.test.ts layout.test.ts
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
```

最初の静的検索は `D:\nginx\app` から Repository Root 基準の相対 Path を使用し、対象 Path 不在となりました。正しい相対 Path で再実行して表示名と要件文書を確認します。
