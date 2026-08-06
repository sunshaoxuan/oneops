# 测试结果

| 测试 | 结果 |
| --- | --- |
| Node | 200 passed |
| Python Worker | 14 passed |
| Vitest | 18 Files，154 passed |
| Production Build | 合格 |
| Migration 003 回归 | 不再创建废弃 `classification` 列 |
| Migration 034 | Scope、字段候选、用途设置和权限合格 |
| Migration 全量重放 | 合格 |
| Scan 提交失败保护 | 已创建 Scan 会进入 FAILED |
| 再取込后子 Scan | Parent Scan ID 回归测试合格 |
| 正式 Spring Health | HTTP 200，UP |
| 正式 Gateway Auth Config | HTTP 200，本地登录模式 |
| 正式 Scan | `REVIEW_REQUIRED`，Coverage 0.345794 |
| 正式再分析 | 子 Scan `477fa24f...`，Coverage 0.35514，Conflict 物理 ID 2 件 |
| Candidate Apply | `f6e0805d...` 从 `PROPOSED` 进入 `APPLIED`，台账值保持 `0408`，Applied Record 指向组织机构 `2` |
| Apply 审计 | Actor `143a55ae...`，Event `b7531332...`，HTTP 200，SUCCESS |
| Browser | 系统管理设置、扫描概要、Evidence、Conflict、Unresolved、Failure 和 Applied 状态合格 |
| Console | OneOps 应用 Warning 和 Error 为 0；6 条扩展错误全部来自 `chrome-extension://` |
| Screenshot | 四份正式业务截图已保存并完成视觉检查 |
