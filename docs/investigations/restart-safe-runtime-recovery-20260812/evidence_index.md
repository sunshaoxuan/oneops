# 証拠索引

| 主張 | 証拠 | 判定 |
| --- | --- | --- |
| 再起動が Runtime 停止の起点 | Windows System Event 1074、6005、6006 | 確認済み |
| Docker 停止が Database 停止へ波及 | Docker Backend Log、Docker Engine Pipe 不在、55433 Listen 不在 | 確認済み |
| SSO 以前に Backend が停止 | HTTPS SSO Start 502、8092 Listen 不在 | 確認済み |
| EnvPortal は到達可能 | OHR0067:8998 と 192.168.20.38:8999 TCP Test | 確認済み |
| 旧 Task は対話依存 | Task Principal Interactive、Result 0xC000013A | 確認済み |
| 新 Task は非対話常駐 | Principal S4U、State Running、runtime_healthy | 確認済み |
| Platform 復旧 | Docker、PostgreSQL、8092、8093、HTTPS Health、Auth Config | 確認済み |
| 実 Browser | Windows Account 確認画面、Console Error 0、Warning 0 | 確認済み |
| 本番再起動 | 利用者接続保護のため未実施 | evidence_missing |
