# 証拠索引

更新日: 2026-08-03

| 分類 | パス | 用途 |
| --- | --- | --- |
| 詳細設計 | <code>docs/SPRING_BOOT_BACKEND_DETAILED_DESIGN.md</code> | 実装の正本 |
| HTTP Entry | <code>app/gateway/server.mjs</code> | Route、8092、SSE、Timer |
| Auth | <code>app/gateway/auth.mjs</code> | Cookie、CSRF、Password、Permission、SSO HMAC |
| Auth Controller | <code>app/gateway/auth-controller.mjs</code> | Session、Login、代理ログイン |
| Identity DB | <code>app/gateway/identity-database.mjs</code> | User、Role、Session、監査 |
| Environment DB | <code>app/gateway/environment-database.mjs</code> | Transaction、revision、Credential |
| Task DB | <code>app/gateway/personal-task-database.mjs</code> | Owner、Candidate、Sync lock |
| Inquiry | <code>app/gateway/inquiry-support-routes.mjs</code> | Search、Attachment、AI assist |
| AI | <code>app/gateway/ai-assistant-routes.mjs</code> | Session、Attachment、CAG、SSE |
| Crypto | <code>app/gateway/credential-crypto.mjs</code> | AES-GCM、scrypt、AAD |
| Worker Client | <code>app/gateway/builder-worker.mjs</code> | JSON stdin/stdout |
| Worker | <code>app/builder/oneops_worker.py</code> | Request dispatch、filePath |
| Frontend Contract | <code>app/packages/api-client/src/index.ts</code> | 公開 API と型 |
| Database | <code>app/db/migrations</code> | Table、Constraint、Index |
| Nginx | <code>conf/nginx.conf</code> | 443 と 8092 |
| Publish | <code>app/scripts/publish-portal.ps1</code> | Build、Restart、Health |
| Supervisor | <code>app/scripts/ensure-oneops-runtime.ps1</code> | Runtime 復旧順序 |
| 先行調査 | <code>docs/investigations/node-to-transaction-backend-20260803/investigation_report.md</code> | Transaction risk |

## 外部一次資料

- https://docs.spring.io/spring-boot/system-requirements.html
- https://docs.spring.io/spring-modulith/reference/
- https://docs.spring.io/spring-modulith/reference/testing.html
- https://docs.spring.io/spring-framework/reference/data-access/transaction.html
- https://mybatis.org/spring-boot-starter/
- https://docs.liquibase.com/
