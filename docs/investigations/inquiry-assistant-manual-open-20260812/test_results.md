# 試験結果

更新日: 2026-08-12

| 试验 | 状态 | 结果 |
| --- | --- | --- |
| 聚焦 Vitest | 合格 | `ai-assistant.test.ts`、`ai-assistant-ticket-isolation.test.ts`、`inquiry-support.test.ts` 68 項が合格した |
| 工单临时会话边界 | 合格 | 工单上下文仅保留在临时输入键中，首次发送才调用 `createMutation.mutateAsync`，无会话时附件按钮禁用 |
| 工单关联保持 | 合格 | `openInquiryFromAssistant` 重新保存上下文，InquirySupportPage 在同票打开请求处理期间不清空上下文 |
| `pnpm check` | 合格 | Gateway 306 項、Builder 14 項、Portal 259 項、TypeScript、Vite Build 3853 Modules が合格した |
| 正式配信 | 合格 | `delivery_succeeded reason=.continuous-delivery.trigger`，随后 `AiAssistantChat.tsx` 资源更新也成功 |
| 正式 HTTPS Asset | 合格 | 线上 JS 中保留 `ai-assistant-launcher`，未发现工单自动 `setOpen(true)` |
| Browser、Console、Screenshot | 未完成 | 当前认证 Browser 截图仍待用户刷新后确认，状态为 `evidence_missing` |
