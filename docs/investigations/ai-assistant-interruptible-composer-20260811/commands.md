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

## 終端競合返工後の正式 Release

1. `D:\nginx\runtime\node\pnpm.cmd check` を再実行した。Gateway 279 件、Worker 14 件、Portal 219 件、TypeScript 及び Vite Build が成功した。
2. `D:\nginx\runtime\node\pnpm.cmd test:operations` を再実行した。9 Script が成功した。
3. `app\backend` で `.\mvnw.cmd test` を再実行した。40 件中8件 Skip、Build Successである。
4. 終端競合返工を Commit `7231f36a30b3e3349c8f7238ca40f12fe111fd6c` として限定 Stageし、`origin/master` へ Pushした。
5. SYSTEM Continuous Delivery は `2026-08-11T21:06:19.2563555+09:00` に開始し、`21:06:44.5231407+09:00` に成功した。
6. HTTPS と 8092 の Health `UP`、Version `0.18.18`、8093 の Health と Readiness `UP` を確認した。
7. 443、8092、8093 の Listen、8094 と 8095 の非 Listen、Upstream `127.0.0.1:8092` 及び `nginx -t` の成功を確認した。
8. Browser 受入時の `index.html`、`index-Ll7Ak_gu.js`、`index-BQkCaVWd.css` について、Build、配信 Directory 及び HTTPS 応答の SHA256 一致を確認した。

## 正式 Browser 受入

1. 正式 URL の認証済み Session で、Conversation A に長時間 Prompt を送信した。
2. 生成中に通常文字 Paste、`Shift + Enter`、Backspace、`Control + A`、`Enter` 送信抑止、画像 File Paste 抑止、Draft 保持を確認した。
3. TextArea Enabled、添付 Button Disabled、File Input Disabled、Send Button 0 件、Stop Button 1 件を確認した。
4. AIアシスタント Region `left=102`、`top=88`、`width=1290`、`height=1006` を裁切し、生成中 Screenshot を保存した。
5. Stop を選択し、「回答の生成を停止しています」、Draft 保持、TextArea Enabled、添付 Button Disabled、File Input Disabled、Send Button 0 件を確認した。
6. Stop 要求中 Screenshot を保存した。
7. `task.cancelled` 後に Conversation B へ切り替え、B の Draft 空、Stop 0 件、Stop Error 0 件を確認した。A へ戻り、Draft、部分回答及び中立的停止 Status を確認した。
8. Cancelled 後の Stop 0 件、Loader 0 件、失敗 Alert 0 件、Send 復元、添付 Button Enabled、File Input Enabled を確認し、Screenshot を保存した。
9. 保持 Draft を送信し、クイックナビゲーションの User Turn が 3 件から 4 件へ一件だけ増加したことを確認した。
10. 後続 Task の自然完了、Stop 0 件、Loader 0 件、TextArea と添付の復元を確認し、Screenshot を保存した。
11. Page Reload 後に Cancelled 状態、停止文言、User Turn 4 件及び古い Streaming Loader 0 件を確認した。
12. `tab.dev.logs()` で Console Error 0 件、Warning 0 件を確認した。
13. Browser Session を Finalizeした。

## 正式 Access Log と Database 照合

1. `rg -n -F` で対象 Cancel Route を `logs/access.log` から検索した。完全一致は一件、HTTP 202、`request_time=0.169` であった。
2. Message POST は生成開始時の `21:16:21` と保持 Draft 再送時の `21:19:44` に各一件であった。
3. Cancel Task の SSE は `21:17:45` に HTTP 200 で終了し、接続時間は `84.561` 秒であった。
4. OneOps `auth_audit_events` は Stop 成功 HTTP 202 を一件、その他結果を 0 件記録した。
5. CAG `tasks` と `task_events` を読取照合した。Cancel Task `69c96824-96e2-4073-846b-3b22ba09d8ed` は Cancelled 1、Completed 0、Failed 0 であった。
6. 後続 Task `d112c1b5-5767-4879-8822-ef9da4413650` は Completed 1、Cancelled 0、Failed 0 であった。
7. Screenshot 四件の File Size と SHA256 を `Get-FileHash` で取得した。

## 最終 Git 証拠

1. `v0.18.18`をApplication Commit `7231f36a30b3e3349c8f7238ca40f12fe111fd6c`へ作成し、`origin`へPushした。
2. LocalとRemoteの`v0.18.18^{}`が`7231f36a30b3e3349c8f7238ca40f12fe111fd6c`で一致し、現在の`master`と`v0.18.19`の祖先であることを確認した。
3. Task専用WorktreeをGit登録から解除した。残存した依存Junctionと空Directoryを固定Path内で削除し、Directory消失とWorktree非登録を確認した。
4. 調査文書、正式要件、Loader文書及び公開Screenshotだけを限定Stageする。
5. 最終文書検査、`git diff --check`及び受入一覧を第1項から再実行する。
6. 証拠Commitを`origin/master`へPushし、Local HEAD、Local `origin/master`及びRemote Branchの一致を確認する。
