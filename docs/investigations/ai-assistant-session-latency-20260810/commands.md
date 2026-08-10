# 実行記録

1. Git Branch、`HEAD`、`origin/master` 及び保護対象の作業差分を確認した。
2. 利用者 Screenshot を表示し、中央 Spinner と履歴一覧の状態を確認した。
3. Portal、API Client、Node Gateway、Spring Proxy、OneOps PostgreSQL、CAG API、CAG PostgreSQL 及び Redis の経路を追跡した。
4. `auth_audit_events` から AI Session 要求の Status と Duration を取得した。Prompt、回答、Cookie、Token 及び Secret は取得しなかった。
5. CAG Conversation、Tasks、Events を読み取り専用で計測し、Byte 数、Event 種別、件数、文字数及び Hash 一致だけを記録した。
6. `node --test gateway/agent-gateway-request.test.mjs gateway/ai-assistant.test.mjs` を実行した。
7. `pnpm exec vitest run src/ai-assistant.test.ts` を Portal Shell で実行した。
8. `pnpm --filter @one-ops/portal-shell build` を実行した。
9. `node --test gateway/project-language.test.mjs` を実行した。
10. 変更後 Route を実 Agent Gateway 設定へ読み取り専用で接続し、呼出数、所要時間及び応答 Byte 数を計測した。
11. `pnpm check` を実行し、Gateway 255 件、Builder 14 件、Portal 197 件及び Production Build の成功を確認した。
12. `mvnw.cmd test` を実行し、40 件中 32 件成功、Database 環境依存 8 件 Skip を確認した。
13. CAG Backend 186件、Frontend 22件、Production Build、PowerShell 11件及び Compose を実行した。
14. OneOps 0.18.7 で `pnpm check` を実行し、Gateway 261件、Builder 14件、Portal 203件及び Production Build の成功を確認した。
15. `mvnw.cmd test` を実行し、40件中32件成功、Database 環境依存8件 Skip を確認した。
16. Spring Test と Operation Test の初回並列実行は同一 Rolling JAR の占有が競合したため証拠から除外し、Spring、Operation Test の順で再実行した。
17. `pnpm test:operations`、`nginx.exe -t` 及び `git diff --check` を実行し合格した。
18. `git fetch --prune origin` 後に OneOps Commit `fd4e5cb7d9a71a954b5414d7f33cf9d5e7ca5e9f` を `origin/master` へ Push し、同一 Hash を確認した。
19. SYSTEM Continuous Delivery、HTTPS Health、Asset 名及び配信済み Build の SHA-256 を確認した。
20. Browser で Workbench、AIアシスタント、System Management を往復し、Network 相当の Nginx Access Log、Console 及びトリミング済み Screenshot を確認した。
21. 専用 Test Session を作成し、再読込、DELETE、Refresh 後の永続削除を測定した。Test Session は削除済みである。
22. CAG の `/audit`、`/knowledge`、`/memory` を遷移し、TCP 接続、PostgreSQL `pg_stat_activity`、Console 及びトリミング済み Screenshot を確認した。
23. OneOps の安全な Screenshot の SHA-256 が `515431212B480E0C5238E4095AAEF5C3E338C7DDE012F2598982FB5AED38A87F` であることを確認した。
24. CAG PostgreSQL の `pg_stat_user_tables` と3系統 API Process の CPU を20秒差分で観測した。`knowledge_sources` 更新差分0件、CAG API CPU 増分0.062秒、PostgreSQL CPU 1.53%、実行中 Ingestion 1件及び Lease 1件だった。
25. 現行 PostgreSQL と Redis の RestartPolicy が `unless-stopped`、Health が `healthy` であることを `docker inspect` で確認した。現行 Container の `RestartCount` は0で、試験中に停止していない。
26. 最初の隔離試験で `docker kill` は Docker の人工停止として扱われ、`unless-stopped` の対象外だった。次の隔離試験で PID namespace の初期 Process を内部から終了できなかった。両試験は復旧証拠から除外し、無 Port、無 Volume の一時 Container を全て削除した。
27. 同じ PostgreSQL と Redis Image を子 Process で起動し、12秒の安定稼働後に子 Process を異常終了させた。両方で `RestartCount=1`、PostgreSQL `pg_isready` 成功、Redis `PONG` を確認した。現行 CAG Container は操作せず、一時 Container だけを削除した。
28. `project-language.test.mjs` の5件、調査文書6件の日本語及び簡体字 Marker 検査、Screenshot SHA-256、`git diff --check` を実行し、全て合格した。
