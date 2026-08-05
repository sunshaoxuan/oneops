# 実行コマンド記録

## 調査

1. Nginx `proxy_pass`、継続的デリバリー Script、Runtime Supervisor Mutex の追跡
2. 主系 `8092`、内部互換 Gateway `8093` 及び Windows Task の確認

## 検証

1. `pnpm.cmd test`
2. `pnpm.cmd build`
3. `mvnw.cmd test`
4. `mvnw.cmd -Prolling package`
5. `test-operations-scripts.ps1`
6. `nginx.exe -t -p D:\nginx`
7. `git diff --check`
8. 高権限 `OneOps Continuous Delivery` Task から `.continuous-delivery.trigger` を処理
9. 正式 HTTPS Health を 100 ms 間隔で連続監視
10. `8092`、`8093`、`8094`、`8095` の Listen 状態を確認
11. Build と正式 `index.html` の SHA-256 を比較
12. 正式 Browser、Console、Layout 及び Screenshot を確認
