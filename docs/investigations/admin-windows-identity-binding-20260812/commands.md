# 実行コマンド記録

作業ディレクトリは `D:\nginx`。タスクログは `D:\workspace\codex-logs\admin-windows-identity-binding-20260812` に保存する。

## 調査

```text
rg -n -i "auth_identities|provisionWindows|WINDOWS|domainAccount|domainUpn" app docs
git status --short --branch
git rev-parse HEAD
git rev-parse origin/master
```

## 対象検証

```text
D:\nginx\runtime\node\node.exe --test gateway/auth.test.mjs gateway/auth-controller.test.mjs gateway/identity-database.test.mjs
D:\nginx\runtime\node\pnpm.cmd exec vitest run src/auth-ui.test.ts
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell exec tsc -b
D:\nginx\runtime\node\node.exe --test gateway/*.test.mjs
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build
git diff --check
```

## クリーン候補検証

```text
D:\nginx\runtime\node\node.exe --test gateway/*.test.mjs
vitest run src/auth-ui.test.ts src/layout.test.ts
vitest run
tsc -b
```

クリーン候補 `359858b1` では Gateway 298 件及び Portal 対象 35 件が成功した。Portal 全量は 224 件成功、8 件失敗。TypeScript は AIアシスタント契約 8 件及びクリーン Worktree の Design Token 依存解決 1 件で失敗した。

## Runtime 受入

```text
Invoke-RestMethod https://192.168.20.54/api/work-center/v1/health
PUT https://192.168.20.54/api/work-center/v1/auth/users/{id}/windows-identity
Browser https://192.168.20.54/
```

Health は `UP 0.18.20`、未認証 PUT は `401 AUTHENTICATION_REQUIRED`。Browser は Windows SSO 確認待機画面、Console Error と Warning は 0 件。実 Binding は実行していない。
