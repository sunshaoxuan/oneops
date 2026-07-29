# 実行コマンド

## CAG 参照

1. Conversation API、Model、Task Service、SSE Service を `rg` と `Get-Content` で参照した。
2. `GET /api/v1/projects` と `GET /openapi.json` を実行した。
3. 既存 Conversation の `GET /conversations/{id}` と `GET /conversations/{id}/tasks` を実行した。
4. CAG へ POST、PUT、PATCH、DELETE を実行していない。

## OneOps テスト

```powershell
node --test gateway/ai-assistant.test.mjs gateway/auth.test.mjs gateway/operation-audit.test.mjs
pnpm check
pnpm test:operations
```

問合せドロワーの終了時序、Task Prompt からの参照復元、複数問合せ表示は次の対象テストにも含めた。

```powershell
pnpm --filter @one-ops/portal-shell exec vitest run `
  src/ai-assistant.test.ts `
  src/inquiry-support.test.ts
```

## 公開

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File scripts/publish-portal.ps1 `
  -SkipChecks `
  -Reason ai-assistant-multi-inquiry-context
```

公開スクリプトは OneOps Gateway の 8092 だけを再起動した。
