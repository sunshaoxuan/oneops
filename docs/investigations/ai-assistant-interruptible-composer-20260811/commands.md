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

## 最初の正式配信

1. SYSTEM Continuous Delivery は `2026-08-11T20:14:38.2620122+09:00` に開始し、`20:15:38.3154080+09:00` に成功した。
2. HTTPS と 8092 の Health `UP`、Version `0.18.18`、8093 の Health と Readiness `UP` を確認した。
3. 443、8092、8093 の Listen、8094 と 8095 の非 Listen、Upstream `127.0.0.1:8092` を確認した。
4. `D:\nginx\nginx.exe -t -p D:\nginx -c conf\nginx.conf` を実行し、構文検査成功を確認した。
5. 最初の配信時点の `index.html`、`index-Bvl4Go5a.js`、`index-BQkCaVWd.css` について、Build、配信 Directory、HTTPS 応答の SHA256 一致を確認した。

## 終端競合返工

1. `D:\nginx\runtime\node\pnpm.cmd exec vitest run src/ai-assistant.test.ts` を Portal Directory で実行し、1 File、30 件成功した。
2. `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test` を実行し、33 File、219 件成功した。
3. `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build` を実行し、TypeScript、3850 Module の Vite Build、`index-Ll7Ak_gu.js` 及び `index-BQkCaVWd.css` の生成に成功した。
4. 一回目の定向再実行と一回目の Portal 全試験は、別の残存 `pnpm check` が保持していた Gateway 子 Process により Vitest Fork Worker が起動 Timeoutとなった。対象 Test は未実行だった。
5. 残存 Process の PID、Parent PID、開始時刻及び Command Line を確認し、その `pnpm check` Process Tree だけを停止した。正式 Gateway、Vite 開発 Server 及びその他 Node Process は保持した。
6. 残存 Process 除去後に定向試験と Portal 全試験を先頭から再実行し、上記 30 件と 219 件の成功を確認した。
7. `git diff --check` を実行し、空白 Error がないことを確認する。

## 後続の正式 Release 命令

1. `D:\nginx\runtime\node\pnpm.cmd check` を再実行した。Gateway 279 件、Worker 14 件、Portal 219 件、TypeScript 及び Vite Build が成功した。
2. `D:\nginx\runtime\node\pnpm.cmd test:operations` を再実行した。9 Script が成功した。
3. `app\backend` で `.\mvnw.cmd test` を再実行した。40 件中8件 Skip、Build Successである。
4. 限定 Stage、返工 Commit、`origin/master` への Pushを実行する。
5. SYSTEM Continuous Delivery を再実行する。
6. HTTPS Health、Listener、Upstream、nginx 構文、新 Build と配信 Asset Hash を再確認する。
7. Browser DOM、Network、Console、Screenshot を確認する。
8. 最終証拠文書を限定 Stage、Commit、Pushし、`v0.18.18` Tag と Remote Equality を確認する。
