# コマンド記録

## 調査

1. `git fetch origin master --prune`
2. `git status --short --branch`
3. `rg` による AI助手、AI設定、権限、Migration、監査経路の検索
4. OpenAI、Microsoft、Google、NIST 公式情報のオンライン検索

## 検証

1. `node --check` による Gateway ファイル構文確認
2. `node --test app/gateway/ai-assistant.test.mjs app/gateway/auth.test.mjs`
3. `pnpm --dir app --filter @one-ops/portal-shell test`
4. `pnpm --dir app --filter @one-ops/portal-shell build`
5. `pnpm --dir app check`
6. PostgreSQL へ Migration 038 を連続 2 回実行し件数、列、制約を確認
7. 8094 Spring 候補 Backend と 8095 Node Gateway を隔離起動し Health を確認
8. Browser fixture で AI助手、カテゴリ、第 2 階層、管理一覧、編集 Modal、Console を確認

## 配信

1. `git commit -m "AI助手にクイックアシスタントを追加する"`
2. `git push origin master`
3. `git fetch origin master --prune`
4. `git rev-parse HEAD` と `git rev-parse origin/master` の一致確認

機能 Commit は `9abcb04` とする。正式 Nginx 流量の切替、正式 Web Root への配信、Git Tag は実施していない。
