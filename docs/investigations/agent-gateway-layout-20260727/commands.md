# 命令记录

日期：2026-07-27

1. `rg -n "Agent Gateways|Gatewayを追加|SSE 会話|agentGateway|gateway" app/apps/portal-shell/src docs`
2. `pnpm check`
3. `git diff --check`
4. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -AppRoot D:\nginx\app -Reason fix-agent-gateway-layout-20260727 -SkipGatewayRestart`
5. `Invoke-WebRequest https://192.168.20.54/ -SkipCertificateCheck`
6. 浏览器打开系统管理、AI 设置、Agent Gateways，新增空白设置卡片并测量字段尺寸。
7. 浏览器检查控制台并保存完整页面截图。

## 发布命令修正

初次调用错误地使用了 `D:\nginx\scripts\publish-portal.ps1`，仓库中的正式脚本位于 `D:\nginx\app\scripts\publish-portal.ps1`。随后在 Windows PowerShell 中执行正式脚本并发布成功。
