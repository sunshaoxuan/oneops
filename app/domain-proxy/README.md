# OneOps 域认证代理安装

本安装包必须在已加入 OneHR 域的 Windows 主机上执行。

1. 使用管理员身份解压安装包。
2. 以管理员身份运行 `install-oneops-domain-proxy.cmd`。
3. 安装器验证域成员身份、注册 Windows 集成认证监听、限制防火墙范围、启动计划任务并检查健康状态。

OneOps 主机上的就绪监视器每秒检查一次代理。代理健康且确认已加入域后，系统会自动写入共享密钥、启用自动 SSO 并重启网关。

卸载时执行：

```powershell
Unregister-ScheduledTask -TaskName "OneOps Domain Proxy" -Confirm:$false
Remove-NetFirewallRule -DisplayName "OneOps Domain Proxy 8997"
netsh.exe http delete urlacl url=http://+:8997/
```
