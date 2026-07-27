# 证据索引

| 证据 | 路径 | 用途 |
| --- | --- | --- |
| 需求基线 | `docs/INQUIRY_SUPPORT_REQUIREMENTS.md` | 确认抽屉、问题分区、聊天布局与手动 AI 边界 |
| 数据迁移 | `app/db/migrations/016_create_inquiry_support.sql` | 权限、设置、辅助任务和事件的物理数据模型 |
| 真实网站适配 | `app/gateway/inquiry-support-source.mjs` | 登录、查询、正文换行保真、CLOSED 评价、详情分组、附件代理与稳定键 |
| AI 安全边界 | `app/gateway/inquiry-analysis.mjs` | 脱敏、不可信正文、显式 Provider 与结果校验 |
| 公共 API | `app/gateway/inquiry-support-routes.mjs` | 查询、详情、附件、辅助任务和事件接口 |
| 前端实现 | `app/apps/portal-shell/src/InquirySupportPage.tsx` | 大型抽屉、聊天布局、手动 AI 面板 |
| 附件解析编排 | `app/gateway/inquiry-attachment-parser.mjs` | 下载限制、状态契约、缓存、正文上限与详情合并 |
| 附件内容解析 | `app/gateway/inquiry_attachment_parser.py` | PDF、Office、文本解析及扫描 PDF OCR 回退 |
| Windows OCR | `app/gateway/inquiry_attachment_ocr.ps1` | 日语 WinRT OCR 与逐页结果输出 |
| 系统设置 | `app/apps/portal-shell/src/InquirySupportSettingsPage.tsx` | UPDS 登录信息与 Provider 选择 |
| 后端测试 | `app/gateway/inquiry-support.test.mjs` | 脱敏夹具、分组、稳定键与脱敏验证 |
| 前端测试 | `app/apps/portal-shell/src/inquiry-support.test.ts` | 布局、标签、权限与手动调用边界 |
| 脱敏截图 | `docs/investigations/inquiry-support-20260727/inquiry-support-drawer-redacted.png` | 真实抽屉宽度、公开标记、内部标记、消息头与 AI 入口 |
| 审计需求 | `docs/SYSTEM_OPERATION_AUDIT_REQUIREMENTS.md` | 系统级操作范围、字段、权限、Token 与查询节点 |
| 审计迁移 | `app/db/migrations/017_expand_operation_audit.sql` | 会话、能力、结果、耗时及 AI Token 数据模型 |
| 审计分类 | `app/gateway/operation-audit.mjs` | 业务 API 能力、动作、对象与结果标准化 |
| 审计截图 | `docs/investigations/inquiry-support-20260727/system-operation-audit-redacted.png` | 独立节点、摘要、筛选与结果区布局 |
| 附件解析截图 | `docs/evidence/inquiry-attachment-parsed-20260727.png` | 真实扫描 PDF 的脱敏“解析済み”状态 |
