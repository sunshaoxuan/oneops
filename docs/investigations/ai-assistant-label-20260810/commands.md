# 実行コマンド記録

更新日: 2026-08-10

## 基線と影響範囲

1. `git fetch origin master --prune`
2. `git rev-parse HEAD`
3. `git rev-parse origin/master`
4. `rg` による `AI助手`、`AI アシスタント`、`AAIアシスタント` の範囲検索
5. `git diff --check`

## 稼働前確認

1. Spring Health `http://127.0.0.1:8092/api/work-center/v1/health`
2. Node Readiness `http://127.0.0.1:8093/api/work-center/v1/readiness`

## 試験と Build

1. `node.exe --test gateway/database-migration.test.mjs gateway/personal-task.test.mjs`
2. `pnpm.cmd --filter @one-ops/portal-shell exec vitest run` による関連 9 File の試験
3. `app/backend/mvnw.cmd test`
4. `pnpm.cmd check`
5. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/test-operations-scripts.ps1`

全量 Portal 試験時だけ `layout.test.ts` の Version 期待値を正式値 `0.18.3` へ変更し、試験直後に利用者の作業値 `0.17.2` へ戻した。

## Commit、公開及び稼働確認

1. 明示 File 一覧による `git add` と `git commit`
2. `git push origin master` と `git fetch origin master --prune`
3. `publish-portal.ps1 -Reason ai-assistant-label-0.18.3`
4. Nginx Reload 失敗後の Upstream、Port、Health、候補 Process 確認
5. Continuous Delivery Watcher の一時停止
6. 0.18.3 Rolling JAR Build と Backup 付き固定 Port 置換
7. `publish-portal.ps1 -SkipChecks -SkipGatewayRestart -Reason ai-assistant-label-0.18.3-fixed-port`
8. Spring Health、Node Readiness、Auth Config、HTTPS、Database Permission、公開 Bundle の確認
9. Edge と In-app Browser による Windows SSO 確認

秘密情報を含む環境変数、Credential、Token は記録しない。
