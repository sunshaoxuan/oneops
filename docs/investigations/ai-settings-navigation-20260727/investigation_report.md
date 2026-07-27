# AI 设置功能层级调查

日期：2026-07-27

## 结论

原实现把 `Model API` 与 `Agent Gateway` 放在 `ModelDesignPage` 内部的 Ant Design Tabs 中。系统管理导航中的 `AI設定` 只有一个同名子项，因此导航层级没有表达两个独立功能。

本次调整将系统管理区的稳定功能键拆分为 `model-api` 与 `agent-gateways`。`AI設定` 作为共同导航组，直接显示 `Model API` 与 `Agent Gateways` 两个子功能。页面组件接收明确的 `section`，每次只渲染一个功能的标题、说明、卡片与操作。

## 行为路径

1. `App.tsx` 根据 `models.settings.read` 构造 `AI設定` 导航组。
2. 用户选择子项后，`selectedSection` 保存对应稳定功能键。
3. `ModelDesignPage` 接收 `section` 并渲染对应内容。
4. 两个画面继续读取同一个公共 AI 设置接口，保存、测试与删除接口保持不变。

## 风险边界

本次没有修改 AI 设置 API、Agent Gateway API、数据库迁移、Secret 处理与权限定义。未纳入用户正在维护的 Agent Gateway 技术规格书文件。
