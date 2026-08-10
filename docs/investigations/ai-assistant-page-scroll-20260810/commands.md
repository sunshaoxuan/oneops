# 実行コマンド

1. `git fetch origin master`
2. `git status --short`
3. `rg` による `portal-main`、`portal-content-ai-assistant`、`ai-assistant-conversation` の追跡
4. `pnpm exec vitest run src/ai-assistant-page-scroll-layout.test.ts`
5. Vite を 127.0.0.1:5174 で起動
6. Browser で短い会話及び長い会話の寸法、overflow、Console、Screenshot を確認
7. `D:\nginx\runtime\node\pnpm.cmd check`
8. `app/backend/mvnw.cmd test`
9. `app/scripts/test-operations-scripts.ps1`
10. `git worktree add --detach D:\workspace\codex-work\ai-assistant-scroll-release 38f95e6`
11. 隔離 worktree で `pnpm install --offline --frozen-lockfile`
12. 隔離 worktree で本変更の 2 tests と production build を実行
13. 隔離 worktree で全量 `pnpm check` を実行し、既存 Portal 旧断言 7 件を確認

正式公開、正式 HTTPS 検証及び Tag は隔離全量試験の未合格により実行しない。
