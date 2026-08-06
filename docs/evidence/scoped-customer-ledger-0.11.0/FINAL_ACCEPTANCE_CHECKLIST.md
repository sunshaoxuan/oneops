# 27 项最终验收清单

| No. | 验收项 | 成果与证据 | 状态 |
| --- | --- | --- | --- |
| 1 | OneOps 不发送实际路径 | Scan Service Request 测试 | 合格 |
| 2 | CAG 解析筑波大学 Scope | `6ea2f756...`，`つ_0408_筑波大学/` | 合格 |
| 3 | 全文件列举 | Manifest 296 | 合格 |
| 4 | 复用 Ready 资料 | Ready Document Version 测试与正式 Task | 合格 |
| 5 | 只准备必要文件 | Scope Ingestion 单元测试 | 合格 |
| 6 | 每个文件有终态 | 37 analyzed，70 failed，189 excluded | 合格 |
| 7 | 遵守字段契约 | schema v1 和完整 Registry 测试 | 合格 |
| 8 | 基础台账引用物理 ID | Classification 与 Maintenance Option UUID | 合格 |
| 9 | 候选必须有证据 | Citation Gate 测试与正式候选 | 合格 |
| 10 | 无证据不推测 | `EVIDENCE_NOT_FOUND` 测试与正式未解决字段 | 合格 |
| 11 | 冲突显式返回 | 两个正式 Conflict，ID `7d9505a8...` 与 `87c821c0...` | 合格 |
| 12 | Coverage 可重算 | 37 除以 107 等于 0.345794 | 合格 |
| 13 | 确认前保护既有值 | Candidates Only 与数据库前后检查 | 合格 |
| 14 | 确认后写入物理台账 | Candidate `f6e0805d...` 为 `APPLIED`，Applied Record `ORGANIZATION:2`，Actor 与成功审计已核对 | 合格 |
| 15 | 外部资料缺失不删除 | No Delete Policy 与测试 | 合格 |
| 16 | 抽取中 API 可用 | 正式抽取期间 Health 200 | 合格 |
| 17 | Error 分类 | Scope、Ingestion、Extraction、Partial 测试 | 合格 |
| 18 | 秘密信息不暴露 | 脱敏测试与正式输出抽查 | 合格 |
| 19 | 再取込与再分析分离 | API 与权限测试 | 合格 |
| 20 | 再执行关系 | 子 Scan `477fa24f...` 指向父 Scan `e109f2ae...` | 合格 |
| 21 | UI 实运用 | 系统管理、扫描概要、Evidence、Conflict、Applied 截图；应用 Console Warning 和 Error 为 0 | 合格 |
| 22 | 最终配信 | Test、Build、Health、`git diff --check` 合格；Release Commit `7ccb3e5` 已 Push 到 `origin/master` | 合格 |
| 23 | Processing Version 切换 | Active 与 Superseded 测试 | 合格 |
| 24 | Processing 失败保护 | 旧 Active 保留和搜索结果测试 | 合格 |
| 25 | 业务时间适用性 | `as_of` Block 选择与排除测试 | 合格 |
| 26 | 两个版本轴独立 | Processor 与 Applicability 测试 | 合格 |
| 27 | 永久保留学习历史 | Document、Processing、Block、Chunk 历史测试 | 合格 |

第 14 项首次正式操作失败后完成返工，并已从第 1 项重新执行完整清单。27 项全部合格，Release Commit 已存在于 `origin/master`。
