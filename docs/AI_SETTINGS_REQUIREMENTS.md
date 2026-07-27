# AI 设置需求

更新时间：2026-07-27

## 功能目标

OneOps 在“系统管理”中提供“AI 设置”，日文显示为“AI設定”。“AI 设置”作为功能组，直接包含 `Model API` 与 `Agent Gateways` 两个独立子功能，统一维护 OpenAI 兼容模型接口与 Agent Gateway 接口。

`Model API` 与 `Agent Gateways` 通过系统管理导航分别进入各自画面。内容区不使用页签切换这两个功能。切换子功能时只渲染当前子功能的标题、说明、设置卡片和操作。

AI 设置属于系统级设置，不显示组织机关上下文，也不按当前组织机关过滤。只有拥有 AI 设置权限的系统管理员可以查看、保存、测试配置。

## 模型接口设置

1. 当前提供方为 `OpenAI`，调用协议使用 OpenAI 兼容 API。
2. 当前任务用途包括 `GENERAL` 与 `SIMPLE`。通用任务和简单任务可以选择不同模型。
3. Endpoint 填写包含 `/v1` 的 OpenAI 兼容 API 根地址。
4. 模型填写兼容接口通过模型列表公开的模型 ID。
5. API Key 由管理员输入并在后端加密保存。
6. 已保存 API Key 在管理画面完整回填，输入框固定显示密码字符，不提供明文显示切换。
7. 每条设置拥有独立、稳定的物理 ID。任务用途、提供方和模型名称不承担物理关联键职责。

模型连接测试向 `{Endpoint}/models` 发送 `GET` 请求，验证地址、Bearer 认证、模型列表结构与目标模型是否存在。后端设置 10 秒超时与 1 MiB 响应上限。

## Agent Gateway 设置

每个 Agent Gateway 设置包含：

1. 独立、稳定的物理 ID。
2. 管理员可识别的名称。
3. 包含 `/api/v1` 的 API Endpoint。
4. 可选的 Bearer Access Token。
5. 启用状态。

Access Token 的保存与回填规则和模型 API Key 相同。未配置 Token 时允许连接无认证的内部 Agent Gateway。

连接测试向 `{Endpoint}/projects` 发送 `GET` 请求，确认 HTTP 连接、可选 Bearer 认证、项目列表结构，并返回项目数量。

## Agent Gateway 任务与 SSE

OneOps 后端提供同源代理，浏览器不直接持有 Agent Gateway 的 Access Token。

1. 创建会话代理到 `POST {Endpoint}/conversations`。
2. 创建任务代理到 `POST {Endpoint}/tasks`，上游应立即返回 HTTP 202。
3. 任务事件代理到 `GET {Endpoint}/tasks/{task_id}/events`。
4. 会话事件代理到 `GET {Endpoint}/conversations/{conversation_id}/events`。
5. SSE 响应保持 `id`、`event`、`data` 和心跳注释。
6. `after_sequence`、`follow` 与 `Last-Event-ID` 传递到 Agent Gateway。
7. 前端按照 sequence 排序和去重，并在刷新后从最后 sequence 恢复。
8. OneOps 在客户端断开时中止上游请求。

当前 CAG 任务响应使用 `id` 字段。OneOps 客户端同时接受规格书示例中的 `task_id` 字段。

## 安全与审计

1. API Key 与 Access Token 通过需要系统管理员权限的 HTTPS 设置接口读取和提交。
2. 后端使用 AES-256-GCM 加密，附加认证数据绑定设置物理 ID。
3. Endpoint 不允许 URL 用户名、密码、查询参数或片段。
4. 保存、删除与连接测试需要 CSRF 校验和 `models.settings.write` 权限。
5. `models.settings.read` 与 `models.settings.write` 当前只授予 `SYSTEM_ADMIN`。
6. 保存、删除和连接测试写入审计事件，审计详情不包含 Secret。

## API

1. `GET /api/work-center/v1/ai-settings`
2. `PUT /api/work-center/v1/ai-settings/models/{purpose}`
3. `POST /api/work-center/v1/ai-settings/models/test`
4. `POST /api/work-center/v1/ai-settings/agent-gateways`
5. `DELETE /api/work-center/v1/ai-settings/agent-gateways/{id}`
6. `POST /api/work-center/v1/ai-settings/agent-gateways/test`
7. `POST /api/work-center/v1/agent-gateways/{id}/conversations`
8. `POST /api/work-center/v1/agent-gateways/{id}/tasks`
9. `GET /api/work-center/v1/agent-gateways/{id}/tasks/{task_id}/events`
10. `GET /api/work-center/v1/agent-gateways/{id}/conversations/{conversation_id}/events`

原有 `model-settings` API 保留，映射到 `GENERAL` 模型设置。

## 验收

1. 系统管理顶部显示“AI设置”，日文显示“AI設定”。
2. AI 设置导航组直接包含 `Model API` 与 `Agent Gateways` 两个独立子功能入口。
3. 两个子功能进入各自内容画面，内容区不显示用于切换二者的页签。
4. 通用任务与简单任务可以分别保存和测试模型设置。
5. 可以新增、编辑、删除和测试多个 Agent Gateway。
6. 设置画面占满系统管理内容工作区。
7. 每个设置卡片的测试与保存按钮位于卡片底部右侧，主操作位于最右侧。
8. Secret 刷新后完整回填并显示为密码字符。
9. SSE 代理保留事件格式并支持断线恢复。
10. 自动化测试、生产构建、数据库迁移、浏览器页面、控制台与截图验证全部通过。
