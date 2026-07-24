# 最终回执

task: EnvPortal 初始数据导入

execution_status: completed_with_pending_review

source_manifest_sha256: `8bdd9c9dd66c662317fcf2cdd1341f86d815635e5725e9fbe90e5c544231f353`

database_backup: `D:\nginx\backup\oneops-before-envportal-import-20260724-1801.dump`

import_batch_id: 1

imported_environments: 4

staged_rows: 13

matched_staged_rows: 1

unmatched_rows: 8

conflicts: 0

credential_fields_excluded: 31

idempotency_check: passed

automated_tests: passed

browser_validation: passed

console_errors: 0

console_warnings: 0

remaining_review:

1. “标准版”环境归属。
2. 2 条社内 RDP 记录归属。
3. 5 条遗留标签关联归属。
4. 4 条正式环境的准确用途与最后确认日期。
5. 部署服务器完整数据与最近备份。

rollback:

1. 停止 OneOps 写入。
2. 恢复导入前 PostgreSQL 备份。
3. 重启网关。
4. 验证数据库、接口和页面。
