# 执行命令

1. `D:\nginx\runtime\node\pnpm.cmd --dir app test`
2. `D:\nginx\runtime\node\pnpm.cmd --dir app build`
3. 按文件名顺序向正式 PostgreSQL 重放 `app/db/migrations/*.sql`，启用 `ON_ERROR_STOP=1`
4. `createCustomerKnowledgeScanService.start("2", ...)`
5. `createCustomerKnowledgeScanService.reanalyze("2", parentScanId, ...)`
6. `Invoke-RestMethod http://127.0.0.1:8092/actuator/health`
7. `Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/auth/config`
8. `git diff --check`
9. Browser 打开系统管理客户台账知识设置和筑波大学客户信息，检查 DOM、Console 并保存 Screenshot
10. 查询 `organizations`、`customer_knowledge_scan_candidates` 和 `auth_audit_events`，核对 Apply 前后物理记录

数据库命令通过环境文件读取连接参数，输出中不打印密码。
