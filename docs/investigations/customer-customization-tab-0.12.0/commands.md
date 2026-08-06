# 実行 Command

1. `git fetch origin master`
2. `D:\nginx\runtime\node\pnpm.cmd --dir app --filter @one-ops/portal-shell test`
3. `D:\nginx\runtime\node\pnpm.cmd --dir app --filter @one-ops/portal-shell build`
4. `D:\nginx\app\backend\mvnw.cmd test`
5. `D:\nginx\runtime\node\pnpm.cmd --dir app check`
6. `D:\nginx\runtime\node\pnpm.cmd --dir app test:operations`
7. `app\scripts\publish-portal.ps1 -Reason customer-customization-tab-0.12.0`
8. 正式 HTTPS 入口と Local Dist の JavaScript Asset Path を比較
9. 正式 Health API の Status と Version を確認
10. Browser で「カスタマイズ情報」を選択し、DOM、Desktop、390px、Console 及び Screenshot を確認
11. `git diff --check`

資格情報、Session、Token 及び顧客の秘密情報は Command Output と証拠へ保存していない。
