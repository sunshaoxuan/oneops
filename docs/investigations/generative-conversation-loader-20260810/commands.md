# コマンド記録

```powershell
git status --short --branch
git remote -v
git fetch origin master
git rev-parse HEAD
git rev-parse origin/master
D:\nginx\runtime\node\pnpm.cmd view generative-loaders version license engines peerDependencies dist.tarball repository --json
D:\nginx\runtime\node\pnpm.cmd add --filter @one-ops/portal-shell generative-loaders@0.1.1 --save-exact
D:\nginx\runtime\node\pnpm.cmd exec vitest run src/GenerativeConversationLoader.test.tsx src/ai-assistant.test.ts
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
D:\nginx\runtime\node\pnpm.cmd check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -SkipChecks -SkipGatewayRestart -Reason generative-conversation-loader-20260810
curl.exe -k -I -sS https://192.168.20.54/
D:\nginx\runtime\node\pnpm.cmd audit --prod --audit-level high
git add -- <本タスクの対象限定ファイル>
git commit -m "feat: AI会話ローダー工程インターフェースを追加する"
git fetch origin master
git push origin master
```

ブラウザでは `https://generativeloaders.com/` と `https://generativeloaders.com/docs` を開き、公開コンポーネント、props、アクセシビリティ、ライセンス表示を確認した。

OneOps の実画面確認では in-app Browser が Windows SSO で `ERR_INVALID_AUTH_CREDENTIALS`、Edge が SSO 遷移先を `ERR_BLOCKED_BY_CLIENT` として停止した。Chrome 接続は利用できなかった。
