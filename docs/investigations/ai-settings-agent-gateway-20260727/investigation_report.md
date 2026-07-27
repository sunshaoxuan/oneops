# OneOps AI 设置与 Agent Gateway 调查

日期：2026-07-27

## 结论

现有 OneOps 只有一条 `OPENAI` 模型设置，数据表以 provider 唯一，无法区分通用任务与简单任务。现有系统管理菜单、页面标题和接口名称仍使用“模型设计”。

CAG 0.3.0 当前提供项目查询、会话创建、任务创建、任务事件 SSE 与会话事件 SSE。任务创建返回 HTTP 202，任务标识字段为 `id`。任务事件使用任务内 sequence，会话事件使用会话内 sequence，并包含 task_sequence。

网站层 Agent Gateway 规格书要求网站后端代理 SSE、传递 Last Event ID、按 sequence 去重、避免浏览器持有上游 Secret。OneOps 应使用同源后端代理完成这些要求。

## 实现边界

1. 将可见名称改为“AI设置”，日文改为“AI設定”。
2. 模型设置增加 `GENERAL` 与 `SIMPLE` 两种任务用途。
3. 新增可维护多个 Agent Gateway 的设置表与管理画面。
4. Agent Gateway Endpoint 使用包含 `/api/v1` 的 API 根地址。
5. 新增项目连接测试，兼容无认证 CAG 与 Bearer Token 网关。
6. 新增会话、任务与 SSE 的同源代理 API。
7. 保留旧模型设置接口，兼容现有调用。

## 来源差异

规格书中的任务响应示例使用 `task_id`，CAG 0.3.0 源码响应使用 `id`。OneOps API 客户端同时接受两个字段。SSE 内容由后端透明传输，避免丢失未来新增事件字段。

规格书示例的 EventSource 依赖 Cookie 认证。OneOps 使用同源 EventSource 连接 OneOps 网关，由 OneOps 网关附加保存的 Agent Gateway Token。
