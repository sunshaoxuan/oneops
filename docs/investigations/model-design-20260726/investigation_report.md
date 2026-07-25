# OneOps 模型设计实现调查

## 结论

模型设置应接入现有系统管理横向分组菜单，使用独立系统级权限，并沿用后端敏感凭据加密能力。配置保存到数据库，运行期读取，不写入前端构建产物或普通 JSON 配置。

连接测试采用 OpenAI 模型列表接口 `GET {Endpoint}/models`，可验证地址、认证和目标模型可见性，且不会发起模型推理。

## 控制路径

1. `App.tsx` 根据系统权限显示系统管理入口。
2. `SystemManagementPage` 提供模型设计分组。
3. `ModelDesignPage.tsx` 通过 API Client 读取、保存和测试。
4. `server.mjs` 执行身份认证、权限、CSRF、输入校验和审计。
5. `model-settings-database.mjs` 读写 `ai_model_settings`。
6. `credential-crypto.mjs` 使用物理 ID 绑定的认证加密保护 API Key。
7. `model-settings.mjs` 验证 OpenAI 兼容 Endpoint 并执行受限连接测试。

## 已验证事实与限制

当前自动化测试使用本地 HTTP 桩响应，不需要真实 API Key。目标页面的生产运行验证与截图记录在本目录的测试结果和最终回执中。
