# 実行記録

## 調査

1. `git fetch origin master`
2. `rg` による Portal 送信入口、SSE、Gateway Message Route、Repository 及び既存 Test の追跡
3. 正式要件と旧並行送信契約の照合
4. OpenAI 公式文書で回答の完了、取消し及び失敗 Event を確認

## 試験と Build

1. `D:\nginx\runtime\node\node.exe --test app/gateway/ai-assistant-database.test.mjs app/gateway/ai-assistant.test.mjs app/gateway/personal-task.test.mjs`
   結果: 39 Tests 合格。
2. `D:\nginx\runtime\node\pnpm.cmd exec vitest run src/ai-assistant.test.ts`
   結果: Portal 集中試験 23 Tests 合格。
3. `D:\nginx\runtime\node\pnpm.cmd check`
   結果: Gateway 274、Worker 14、Portal 211、TypeScript 及び Production Build 合格。
4. `app\backend\mvnw.cmd test`
   結果: 40 Tests、Failures 0、Errors 0、環境依存 8 Skipped。
5. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\test-operations-scripts.ps1`  作業 Directory: `D:\nginx\app`
   結果: 9 Scripts 合格。
6. `D:\nginx\runtime\node\node.exe --test app/gateway/project-language.test.mjs`
   結果: 日本語、名称、Version、Comment 及び第三者 Snapshot の 5 Tests 合格。

## 正式配信と Runtime

1. SYSTEM Continuous Delivery
   結果: 2026年8月11日 16時21分30秒に開始し、16時22分47秒に `delivery_succeeded` を記録した。
2. `Invoke-RestMethod` と `curl.exe` による 8092、8093、正式 HTTPS Health 確認
   結果: 正式 Health `UP`、Version `0.18.16`、`online=true`、`legacyGatewayReady=true`。8092 と 8093 も `UP`。
3. `Get-NetTCPConnection -State Listen`
   結果: 443、8092、8093 が Listenし、8094 と 8095 は Listenしていない。
4. `D:\nginx\nginx.exe -p D:\nginx\ -c conf\nginx.conf -t`
   結果: nginx 設定構文と設定試験は成功した。
5. `Get-FileHash -Algorithm SHA256`
   結果: Production Build、配信 Directory、正式 HTTPS 応答の `index.html`、主 JS、主 CSS は三層で一致した。

## 正式 Browser

1. 実行中 Conversation の DOM を取得し、TextArea、送信 Button、添付 Button、File Input、`aria-busy`、案内文及び User Message 件数を確認した。
   結果: 全送信入口が無効、`aria-busy="true"`、案内 1 件、Fill と `Enter` は拒否、User Message 4 件。
2. 別 Conversation へ切り替え、実行元 Conversation へ戻した。
   結果: 別 Conversation は利用可能で、実行元 Conversation の Lock は継続した。
3. Task 終端後の DOM を取得し、送信しない Draft を入力して送信 Button の復元を確認した後、Draft を削除した。
   結果: 54 秒で五項目の回答を完了した。TextArea、添付 Button、File Input は利用可能、`aria-busy="false"`、案内 0 件、Draft 入力時の送信 Button は利用可能、User Message は 4 件のまま。
4. Browser Console の Error、Warn、Warning を最大 200 件取得した。
   結果: `[]`。Error 0 件、Warning 0 件。
5. 実行中と終端後の正式 Screenshot を取得し、AIアシスタント領域だけを切り抜いた。
   結果: `single-flight-locked-0.18.16.png` と `single-flight-terminal-0.18.16.png`。Account 表示を除外し、両方を PNG 形式として検証した。両画像は同じ受入 Conversation の同じ Message に対する実行中と終端後を記録する。

## Git と Tag

1. `git fetch origin --prune`、`git ls-remote origin refs/heads/master`
   結果: 実装配信時点の `HEAD` と `origin/master` は `53553b6b86c8a3a5a2c92322b4b2b79e6cbb824d` で一致した。
2. Browser 証拠、最終受入文書及び Screenshot だけを対象 File として Commitし、`origin/master` へ Pushした。
3. `git tag -a v0.18.16` と `git push origin refs/tags/v0.18.16`
4. `git rev-parse HEAD`、`git rev-parse origin/master`、`git rev-parse 'v0.18.16^{}'`、`git ls-remote`
   最終結果: `HEAD`、`origin/master` と `v0.18.16^{}` が同じ Object ID を指す。
