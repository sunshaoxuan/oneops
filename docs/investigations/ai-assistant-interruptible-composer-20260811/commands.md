# 実行記録

## CAG

1. `backend` で `.\.venv\Scripts\python.exe -m pytest` を実行した。結果は 190 件成功、4 件 Skip、Coverage 85.27%。
2. `frontend` で `D:\nginx\runtime\node\pnpm.cmd test` を実行した。結果は 22 件成功。
3. `frontend` で `D:\nginx\runtime\node\pnpm.cmd build` を実行した。結果は成功。
4. `git diff --check`、Version Scan、OpenAPI Route Scan を実行した。結果は成功。
5. Commit `8880e0522e8e18fe0c034ae6426618d7a380ded2` を `origin/master` へ Pushし、`v0.28.4` を Pushした。
6. `manage-local-codex-gateway-task.ps1` で 8002、8001、8000 の順に Rolling Restartした。
7. 各 Endpoint の `/health/live`、`/health/ready`、`/openapi.json` を確認した。
8. 8001 へ制御済み Task を作成し、Task Cancel、終端 Poll、SSE Event 件数を確認した。

## OneOps 重点検証

1. `D:\nginx\runtime\node\node.exe --test gateway/ai-assistant.test.mjs gateway/ai-assistant-database.test.mjs gateway/operation-audit.test.mjs`
2. Main Runtime と同じ Lockfile 依存を専用 Worktree へ Task 内 Junction で参照し、Vitest の AI Assistant、Interaction、Loader 4 File を実行した。
3. TypeScript `tsc -b` を実行した。
4. `git diff --check` を実行した。

## OneOps 全検証

1. `D:\nginx\runtime\node\pnpm.cmd check` を実行した。Gateway 279 件、Worker 14 件、Portal 213 件及び Production Build が成功した。
2. `D:\nginx\runtime\node\pnpm.cmd test:operations` を実行した。9 Script の解析と全運用契約が成功した。
3. `app\backend` で `.\mvnw.cmd test` を実行した。40 件中 32 件成功、8 件 Skip、Build 成功。

## 正式 Release で追記する命令

1. SYSTEM Continuous Delivery。
2. HTTPS Health、Listener、Upstream、nginx 構文、Build と配信 Asset Hash。
3. Browser DOM、Network、Console、Screenshot。
4. 限定 Stage、Commit、Push、Tag、Remote Equality。
