# OneOps Scope 指定客户台账抽取调查报告

更新日：2026-08-06

## 目标

OneOps 在不了解 CAG 实际路径和文件清单的情况下，以组织机构和 Source 物理 ID 发起客户台账分析，保存候选、证据、Coverage、冲突和版本，并在人工确认后更新物理台账。

## 运行时发现

1. 用途设置最初为空，已配置 `CUSTOMER_LEDGER_EXTRACTION`，设置物理 ID 为 `bbcd67c1-b982-4970-874f-0d3a6d71eec8`。
2. Migration 034 首次运行不完整，字段 Option 表缺失。重新完整应用后，稳定 Maintenance Option UUID 已存在。
3. Migration 执行器每次启动重放全部 SQL。旧 Migration 003 反复创建随后被 004 删除的 `classification` 列，累计 1593 个删除列槽并触发 PostgreSQL 1600 列限制。已删除旧列定义。
4. 未发布 Migration 033 仍操作旧 `candidate_type` 约束。Migration 034 已使用 `field_code` 取代旧结构，因此已删除 033。
5. 修复后 001 到 034 的所有现存 Migration 可以完整幂等重放，Spring Health 与 Gateway Auth Config 均返回 200。
6. 正式 Apply 首次返回 500。根因为结构化字符串值被直接转换为 Object 字符串，同时 SQL 引用了现行 `organizations` 表不存在的 `updated_at` 列。现行实现先取得正式标量值，并只更新实际业务列。非法结构在执行 SQL 前拒绝。

## 正式扫描

组织机构主键为 2，Subject UUID 为 `7ebe3b5d-015a-4718-9931-64994017338e`。正式 Scan `e109f2ae-a3a2-4023-bb40-3fad9a95a45e` 返回 `REVIEW_REQUIRED`，父 Scan 为空，CAG Task 为 `446f445d-90b5-4f24-ad7e-84532f2195d1`，Scope 为 `6ea2f756-ac3e-4ae9-b154-8c6e2ace8ea3`。

正式再分析 Scan `477fa24f-b0fc-4b5f-831c-f40f75fce657` 返回 38 analyzed、69 failed、189 excluded 和 0.35514 Coverage。Candidate `f6e0805d-3a80-493f-83db-96cbc3ba4c76` 经 Browser 反映后进入 `APPLIED`，组织机构物理记录 `2` 的 Code 在反映前后均为 `0408`，审计 Event `b7531332-4d8a-4eff-9583-3d2b87c729a3` 返回 SUCCESS。

系统管理知识源设置、筑波大学扫描概要、Candidate Evidence、Conflict、Unresolved、Document Failure 和 Applied 状态均完成 Browser 与 Screenshot 验收。OneOps 应用 Console Warning 和 Error 为 0。浏览器扩展产生 6 条独立错误，来源为 `chrome-extension://`，未归属于 OneOps 应用。
