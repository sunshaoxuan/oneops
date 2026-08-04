# 実行コマンド

## 1. リポジトリ確認

```powershell
git fetch origin master
git status --short
git rev-parse HEAD
git rev-parse origin/master
```

## 2. 関連実装の検索

```powershell
rg -n "FULL_TICKET|overallAssessment|INQUIRY_ANALYSIS_RESPONSE_INVALID" app/gateway app/apps/portal-shell/src docs/INQUIRY_SUPPORT_REQUIREMENTS.md
```

## 3. 定向試験

```powershell
.\runtime\node\node.exe --test app/gateway/inquiry-support.test.mjs
```

```powershell
..\runtime\node\pnpm.cmd --filter @one-ops/portal-shell exec vitest run src/inquiry-support.test.ts src/layout.test.ts
```

## 4. 完全試験と構築

```powershell
..\runtime\node\pnpm.cmd check
```

## 5. 公開と稼働確認

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app/scripts/publish-portal.ps1 -Reason inquiry-full-ticket-response-normalization-20260804
```

```powershell
.\nginx.exe -t -p D:\nginx
Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health
```

## 6. Spring Backend 隔離構築

```powershell
git worktree add --detach D:\nginx\.codex-work\backend-0.8.8-build HEAD
```

一時作業領域で Backend の版数だけを `0.8.8` へ同期した後、次を実行した。

```powershell
.\mvnw.cmd -q package
```

構築済み JAR を正式位置へ置換し、Windows Task を再起動した。8092 Health が `0.8.8` を返し、8093 が待受状態になるまで確認した。初回の 8093 確認は起動直後の競合によって失敗し、自動回復処理で旧 JAR へ戻った。再実行では Health と 8093 の両方を待機条件へ含め、正常に公開した。

実運用再現では保存済み設定を読み取り、実問合せと現行 Prompt を同じ Model API へ送信した。診断出力は応答キー、型、件数、連番、列挙値に限定し、本文と秘密情報を出力していない。
