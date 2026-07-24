# 证据索引

| 结论 | 证据 | 置信度 | 限制 |
|---|---|---|---|
| 来源包含 5 条环境 | `D:\workspace\envPortal\data.csv`，SHA256 `1a22d2d89df345c8b16e3bda15464a40dc6fca457aac68bd84dd24bb6917506c` | 高 | 只代表当前工作区 |
| 来源包含 3 条 RDP | `D:\workspace\envPortal\rdp.csv`，SHA256 `966c4e427fb697ed9f53da21ccbeb47cf9f00b1db13dfe33c5148ff8b86d7b83` | 高 | 只代表当前工作区 |
| 来源包含 5 条标签关联 | `D:\workspace\envPortal\tags.json`，SHA256 `9ea107f6c7445c0bc05682fff12840b069c3a488c6a2e4db485d964da060b2ef` | 高 | 存在遗留孤立关联 |
| 4 条环境可按 Code 映射 | OneOps `organizations` 查询与脱敏导入报告 | 高 | 9137 名称存在差异 |
| “标准版”没有目标机构 | 脱敏导入报告中 `0000` 行 | 高 | 归属需要人工决定 |
| 31 个凭据字段被排除 | 批次 1 汇总与暂存表聚合查询 | 高 | 只统计非空字段数量 |
| 暂存负载没有凭据字段 | `sanitized_payload` 凭据字段名扫描结果为 0 | 高 | 不检查来源文件本身 |
| 正式导入 4 条环境 | `environments` 与 `organizations` 联表查询 | 高 | 用途仍待确认 |
| 重复执行没有新增记录 | 第二次执行返回 `duplicateBatch=true`，数据库仍为 1 批次、13 暂存行、4 环境 | 高 | 文件变化会形成新批次 |
| 页面显示筑波大学 UHR | `D:\nginx\docs\evidence\envportal-import-tsukuba-20260724.png` | 高 | 只验证一个代表机构 |
| 导入报告已脱敏 | `D:\nginx\docs\evidence\envportal-import-summary-20260724.json` | 高 | 报告保留机构业务名称 |
