# 試験結果

更新日: 2026-08-10

## 関連試験

| 対象 | 結果 |
|---|---|
| Gateway Migration と個人タスク | 19 件合格 |
| Portal 名称、AI 会話、権限、個人タスク | 9 File、64 件合格 |
| Spring Boot | 40 件中 32 件合格、Database 条件の 8 件 Skip、失敗 0 |

## 全量試験と Build

`D:\nginx\runtime\node\pnpm.cmd check` を実行し、次を確認した。

1. Gateway 247 件合格。
2. Python Worker 14 件合格。
3. Portal 30 File、196 件合格。
4. TypeScript Compile と Vite 本番 Build に成功。

Vite は既存の 1,100 kB を超える Chunk について警告した。Build は成功しており、本変更による Error はない。

## 運用 Script

`scripts/test-operations-scripts.ps1` を実行し、9 Script の解析、Atomic Publish、固定 Port Restart Barrier、Gateway Rolling Switch、Frontend Gateway 維持、Runtime Recovery、Composite Readiness、Runtime Supervisor 及び Installer を含む全検査が合格した。

## 公開と Browser

1. 最初の Rolling Publish は Nginx Reload の `OpenEvent` Access Denied で失敗した。Script の回復処理後、Upstream は 8092、Spring は 0.18.2、Node は UP、候補 Port は停止していた。
2. Continuous Delivery Watcher を一時停止し、0.18.3 Rolling JAR を固定 Port 8092 の Primary JAR へ Backup 付きで置換した。Spring Health が 5 秒間 `0.18.3`、UP、Online、Legacy Ready で安定した。
3. `publish-portal.ps1 -SkipChecks -SkipGatewayRestart` を実行し、`delivery_succeeded`、Nginx Config 正常、HTTPS 200 を確認した。SkipChecks は同じ成果物に対する全量試験と Build が直前に二度合格しているため使用した。
4. Node Readiness は UP、Database Ready は true、Windows SSO Enabled と Auto Login は true である。
5. 稼働 Database の `ai.assistant.use` は `AIアシスタント利用` と新しい説明を返した。
6. 公開 Bundle は「AIアシスタント」「AIアシスタント利用」「AI 助手」「AI Assistant」を含み、「AAIアシスタント」を含まない。
7. Edge は内部 SSO URL を `ERR_BLOCKED_BY_CLIENT` で遮断した。In-app Browser は Windows Account 確認状態から遷移しなかった。認証後の主画面、AI 会話、権限マトリクス、Console Warning、Console Error は `evidence_missing` とする。
