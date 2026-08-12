# 最终受领记录

更新日: 2026-08-12

## 最终验收清单

| 原要求 | 成果物 | 状态 |
| --- | --- | --- |
| 进入工单页面不自动弹出聊天 | 浮动窗口初始关闭和移除 ticket 自动 setOpen | 自动测试和线上 JS 合格 |
| 点击 AI 图标打开 | launcher click 行为和测试 | 自动测试合格，Browser 待验证 |
| 关闭后保持关闭 | close click 行为和测试 | 自动测试合格，线上资源已更新 |
| 保留当前工单的会话恢复和创建 | inquiry 会话 Effect | 自动测试合格，Browser 待验证 |
| 仅查看或关闭不创建历史 | 临时 composerSessionId、首次发送创建逻辑 | 聚焦测试合格，Browser 待验证 |
| 首次消息保留工单关联 | 创建时传入 inquiryTicketNo，发送时固定新会话 ID | 聚焦测试合格，Browser 待验证 |
| 附件不在临时会话中提前上传 | 无 selectedId 时附件入口禁用 | 构建和聚焦测试合格 |
| 点击打开问题后保留票号关联 | App 重新保存 context，InquirySupportPage 保留同票请求上下文 | 聚焦测试合格，Browser 待验证 |
| 文档记录变更 | requirements、CHANGELOG、investigation | 已完成 |

## 状态

实现、自动测试和 Portal 构建完成。认证后 Browser、Console、Screenshot 仍需用户刷新页面后确认，当前为 `evidence_missing`，因此暂不宣称完整 UI 验收或正式部署完成。
