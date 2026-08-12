# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| Production の UPN は保存済み | 対象 User と Identity の read-only SQL | 高 | Password Hash は取得及び出力していない |
| 空欄原因は Client Session Cache | `ProfileDialog.tsx` の旧 `user` 参照 | 高 | Browser の旧 Bundle は配信後に再確認する |
| Profile 開始時に最新 Session を取得する | `fetchAuthSession` Query | 高 | Browser DOM を最終確認する |
| Password は独立 Dropdown 機能である | `App.tsx`、`PasswordChangeDialog.tsx` | 高 | LOCAL Identity 条件を Browser で確認する |
| Regression は発生していない | Gateway 302 件、Portal 249 件、TypeScript、Production Build | 高 | Runtime と Browser は配信後に確認する |
| 正式静的資産は配信済み | Delivery Log、nginx 設定試験、HTTPS Health | 高 | Version は既存の `0.18.20` を維持する |
| 認証済み UI は未確認 | Windows SSO 確認画面、Console 0 件、阻害画面 Screenshot | 高 | Dropdown、UPN、Password Dialog は `evidence_missing` |
