# 証拠索引

| 确认事项 | 证据 | 状态 |
| --- | --- | --- |
| 强制展开原因 | `AiAssistantChat.tsx` 的初始状态和 inquiry Effect | 已确认 |
| 手动打开契约 | `ai-assistant.test.ts` | 已追加 |
| 需求与变更记录 | `AI_ASSISTANT_REQUIREMENTS.md`、`CHANGELOG.md` | 已更新 |
| 自动测试与构建 | `test_results.md`、`pnpm check` | Gateway 306、Builder 14、Portal 259、Build 合格 |
| 正式配信 | `continuous-delivery.log` | 13:18:33 `delivery_succeeded`，13:21:43 `AiAssistantChat.tsx` 交付成功 |
| 正式 JS | HTTPS `index-w5LcsfGH.js` | launcher 存在，工单自动展开代码不存在 |
| 正式浏览器 | 页面、Console、Screenshot | `evidence_missing`，认证后画面待用户刷新确认 |
