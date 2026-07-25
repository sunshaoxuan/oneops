# 模型设计需求

更新时间：2026-07-26

## 功能目标

OneOps 在“系统管理”中提供“模型设计”，用于维护系统 AI 能力调用的 OpenAI 兼容 API。当前版本只支持 `OpenAI` 提供方，数据结构与菜单保留以后扩展其他提供方的边界。

模型设计属于系统级设置，不显示组织机关上下文，也不按当前组织机关过滤。只有拥有模型设置权限的系统管理员可以查看、保存和测试配置。

## 配置项目

1. 提供方：使用受控选择框，当前唯一选项为 `OpenAI`。
2. Endpoint：填写包含 `/v1` 的 OpenAI 兼容 API 根地址，例如 `https://api.openai.com/v1`。
3. 模型：填写兼容接口通过模型列表公开的模型 ID。
4. API Key：由管理员输入，在后端加密保存。查询接口与页面不返回明文。

每条模型设置记录拥有独立、稳定的物理 ID。提供方名称不承担物理关联键职责。

已经保存 API Key 时，编辑画面只显示“已配置”状态。输入框留空并保存会保留原 API Key；输入新值会替换旧值。

## 连接测试

连接测试使用当前画面值，允许管理员在保存前验证新 Endpoint、API Key 和模型。

后端向 `{Endpoint}/models` 发送 `GET` 请求，并使用 `Authorization: Bearer {API Key}`。测试同时确认：

1. Endpoint 可以建立连接。
2. API Key 通过认证并具有模型列表访问权限。
3. 响应包含 OpenAI 兼容的 `data` 模型数组。
4. 配置的模型 ID 存在于模型列表。

连接测试不发起文本生成。后端设置 10 秒超时、1 MiB 响应上限，并区分认证失败、无权限、Endpoint 不存在、请求受限、超时、响应格式异常和目标模型不存在。

## 安全与审计

1. API Key 只从 HTTPS 页面提交到 OneOps 后端，前端状态和查询接口均不包含明文。
2. 后端使用 AES-256-GCM 加密，附加认证数据绑定模型设置物理 ID。
3. Endpoint 不允许包含 URL 用户名、密码、查询参数或片段。
4. 保存与连接测试均需要 CSRF 校验和 `models.settings.write` 权限。
5. `models.settings.read` 与 `models.settings.write` 当前只授予 `SYSTEM_ADMIN`。
6. 保存与连接测试写入审计事件，审计详情不包含 API Key。

## API

1. `GET /api/work-center/v1/model-settings`：读取非敏感配置与 API Key 已配置状态。
2. `PUT /api/work-center/v1/model-settings`：保存 Endpoint、模型与可选的新 API Key。
3. `POST /api/work-center/v1/model-settings/test`：使用画面值或已保存 API Key 执行连接测试，不修改配置。

## 验收

1. 系统管理顶部出现“模型设计”分组与“API 设置”入口。
2. 设置卡片占满系统管理内容工作区，宽屏字段使用双列布局，窄屏自动回到单列。
3. 卡片底部使用右对齐操作区，辅助动作“测试连接”位于左侧，主动作“保存设置”位于最右侧。
4. 提供方只有 `OpenAI`。
5. API Key 使用密码输入框，刷新后不回显明文。
6. 未配置 API Key 时禁止保存或测试。
7. 自动化测试覆盖验证、加密绑定、权限映射、连接成功和主要失败分类。
8. 生产构建、网关迁移、目标页面、浏览器控制台和截图验证全部通过。
