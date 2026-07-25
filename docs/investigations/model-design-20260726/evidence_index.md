# 证据索引

| 结论 | 证据 | 置信度 | 限制 |
|---|---|---|---|
| 模型设计是系统级功能 | `app/apps/portal-shell/src/App.tsx` | 高 | 无组织上下文 |
| API Key 不通过查询接口回显 | `app/gateway/model-settings-database.mjs`、`app/packages/api-client/src/index.ts` | 高 | 只返回已配置状态 |
| API Key 使用物理 ID 绑定加密 | `app/gateway/credential-crypto.mjs`、`credential-crypto.test.mjs` | 高 | 加密主密钥来自既有服务器环境变量 |
| 连接测试验证模型列表与目标模型 | `app/gateway/model-settings.mjs`、`model-settings.test.mjs` | 高 | 自动化测试使用本地桩 |
| 只有系统管理员获得模型权限 | `app/db/migrations/014_create_ai_model_settings.sql` | 高 | 迁移执行后生效 |
| OpenAI 使用 Bearer API Key 和 `/v1/models` | OpenAI 官方 API Reference | 高 | 兼容服务需实现相同接口 |
