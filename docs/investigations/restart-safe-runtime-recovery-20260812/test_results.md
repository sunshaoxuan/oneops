# 試験結果

| 試験 | 結果 |
| --- | --- |
| PowerShell 運用 Script Test | PASS、9 Script Parse、全 10 Contract true |
| Runtime 一回復旧 | PASS、Docker、Database、Gateway、SSO、HTTPS ready |
| S4U Installer | PASS、Task Running、LogonType S4U |
| S4U 初回 Cycle | PASS、runtime_healthy |
| HTTPS Health | PASS、UP、0.18.20、upstream.online=true |
| Auth Config | PASS、SSO Enabled、Auto Login、正規 URL |
| Browser Console | PASS、Error 0、Warning 0 |
| 全 Repository Check | FAIL、並行 AI Assistant 未提出変更を含む自動配信 Check が Exit 1 |

本タスクの運用 Script 専項試験は合格しています。全 Repository Check の失敗は共有 Worktree の並行変更を含むため、本タスクの完了証拠として使用しません。
