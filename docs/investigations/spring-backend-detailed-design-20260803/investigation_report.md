# Spring Boot バックエンド詳細設計 調査記録

更新日: 2026-08-03

## 目的

Node.js Gateway を単一の Spring Boot バックエンドへ一括置換するため、現行実装から互換条件を抽出し、開発に使用できる詳細設計へ確定しました。

## 結論

OneOps の公開構成は Nginx HTTPS と内部 API <code>127.0.0.1:8092</code> のまま維持できます。Spring Boot は一つの実行プロセスとし、Identity、基本台帳、環境、問合支援、AI、個人タスク、製品構築、Workbench を Spring Modulith のモジュールとして分離します。

全モジュールが一つの DataSource と Transaction Manager を共有するため、業務操作を Application Service 単位で原子的に実装できます。外部 HTTP、SSE、Python Worker は DB Transaction の外側で実行し、Run 状態と Outbox によって障害復旧を管理します。

実装設計の正本は <code>docs/SPRING_BOOT_BACKEND_DETAILED_DESIGN.md</code> です。

## 確認した現行境界

| 確認事項 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 公開 API は Nginx から 8092 へ転送される | <code>conf/nginx.conf</code> | 高 | 現行ローカル構成 |
| Backend は Node.js Gateway 一プロセスである | <code>app/gateway/server.mjs</code> | 高 | Spring 実装は未着手 |
| Portal は同一オリジン API を使用する | <code>app/packages/api-client/src/index.ts</code> | 高 | API Client 公開関数を互換対象とした |
| PostgreSQL は既存 SQL migration で構築される | <code>app/db/migrations</code>、<code>app/gateway/database.mjs</code> | 高 | migration 番号 009 と 010 が重複する |
| Repository ごとに Pool が存在する | <code>app/gateway/*-database.mjs</code> | 高 | Spring では単一 HikariCP へ統合する |
| Session、CSRF、Password Hash は独自互換形式を持つ | <code>app/gateway/auth.mjs</code> | 高 | Java Golden Test が必要 |
| Credential は AES-256-GCM と AAD を使用する | <code>app/gateway/credential-crypto.mjs</code> | 高 | Context と scrypt parameter を固定する |
| Worker は一行 JSON の標準入出力を使用する | <code>app/gateway/builder-worker.mjs</code>、<code>app/builder/oneops_worker.py</code> | 高 | Request/Response の相関項目は id |
| SSE は複数の公開 Endpoint で使用される | <code>app/gateway/server.mjs</code>、AI、問合せ Route | 高 | Header と再接続契約を維持する |
| Runtime は Windows Task と Supervisor が管理する | <code>app/scripts</code> | 高 | Java Runtime は現時点で未導入 |

## 設計へ反映した事項

1. 単一 Spring Boot Process と 8092 一ポート。
2. Spring Modulith による Package 境界。
3. MyBatis、Spring JDBC、HikariCP の単一 DataSource。
4. Application Service の Transaction。
5. Liquibase baseline と重複 migration 番号の扱い。
6. Session、CSRF、Password、暗号文の byte 単位互換。
7. API、SSE、添付、Worker の既存契約。
8. Windows Task、Publish、Supervisor の置換方式。
9. 本番一括切替と Node rollback。

## 未実施

- Spring Boot ソース作成
- Java Runtime 導入
- Liquibase 実 migration
- Node と Java の暗号 Golden Test
- API contract 実行
- 負荷試験
- 本番切替

これらは詳細設計書の D01 から D12 の実装単位で実施します。
