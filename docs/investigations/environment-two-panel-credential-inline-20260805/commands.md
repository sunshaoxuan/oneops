# 実行記録

更新日: 2026-08-05

1. `git fetch origin master`
2. `D:\nginx\runtime\node\pnpm.cmd test`
3. `D:\nginx\runtime\node\pnpm.cmd build`
4. `D:\nginx\app\backend\mvnw.cmd test`
5. `D:\nginx\app\scripts\test-operations-scripts.ps1`
6. `D:\nginx\nginx.exe -t -p D:\nginx`
7. `git diff --check`
8. Edge で正式 HTTPS 及び同一 Production Build Fixture を表示
9. Browser DOM、Layout Metric、Console、Screenshot を確認
10. Fixture Request Log で認証情報取得 API の有無を確認
11. `.continuous-delivery.trigger` で完全 Rolling 配信を実行
12. 正式 HTTPS を 100 ms 間隔で Availability 監視
13. Health、Listen Port、Nginx Upstream、Static Asset 及び一時 Artifact を確認
14. Trigger を削除し、削除による再配信がないことを確認
