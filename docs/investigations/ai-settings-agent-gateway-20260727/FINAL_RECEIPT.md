# OneOps AI 设置与 Agent Gateway 完成回执

日期：2026-07-27

## 已完成

1. “模型设计”可见名称已调整为“AI设置”，日文为“AI設定”。
2. 模型设置支持通用任务与简单任务分别选择 OpenAI 兼容模型。
3. 现有模型配置自动迁移为 `GENERAL`，物理 ID 与加密 API Key 保持不变。
4. 新增多个 Agent Gateway 的设置、连接测试、保存、删除与 Secret 回填。
5. 新增 Agent Gateway 会话创建、任务创建、任务 SSE 和会话 SSE 同源代理。
6. SSE 代理传递 `after_sequence`、`follow`、`Last-Event-ID`、Bearer Token，并在客户端断开时中止上游请求。
7. API 客户端同时兼容 CAG 的 `id` 和规格书示例的 `task_id`。
8. 旧 `model-settings` API 保留并映射通用任务模型。

## 验收

自动化、数据库迁移、生产构建、发布、真实页面、连接测试、Secret 回填、浏览器控制台与截图检查全部通过。

临时 Agent Gateway 配置与临时管理员账户已经删除。
