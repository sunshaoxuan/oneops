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
13. Operation Test、Nginx Test、配信、Browser、Console 及び Screenshot は最終受入で実行する。
