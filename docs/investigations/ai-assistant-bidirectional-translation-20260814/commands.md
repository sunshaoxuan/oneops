# 実行コマンド

1. `git fetch origin`
2. 正式 PostgreSQL の Conversation、Task、Intent Analysis 及び Routing を読取専用で照合
3. `node --test gateway/ai-assistant-database.test.mjs`
4. `pnpm --dir app check`
5. `app/backend/mvnw.cmd test`
6. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File app/scripts/publish-portal.ps1 -Reason ai-assistant-bidirectional-translation-0.18.23`
7. 手動実行は Nginx SYSTEM Event 権限で終了したため、`.continuous-delivery.trigger` を更新して SYSTEM の正式継続配信を実行
8. `nginx.exe -t -p D:\nginx`
9. `http://127.0.0.1:8092/api/work-center/v1/health` を照合
10. 正式 Browser で日本語、中国語、日本語の順に送信し、出力、Task Ledger、Console 及び Screenshot を照合
