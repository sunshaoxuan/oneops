# 証跡索引

| 確認項目 | 証跡 | 判定 |
| --- | --- | --- |
| 既存ヘッダー構造 | `app/apps/portal-shell/src/App.tsx` | 利用者表示とログアウトを確認 |
| 既存ユーザー管理 | `app/apps/portal-shell/src/IdentityManagementPage.tsx` | 利用者一覧の操作列を確認 |
| セッション境界 | `app/gateway/identity-database.mjs` | 対象利用者 ID で権限を解決 |
| 代理セッション制約 | `app/db/migrations/025_add_user_impersonation.sql` | 実行者 ID と自己指定制約を確認 |
| API 認可 | `app/gateway/auth-controller.mjs` | 権限、CSRF、状態、監査を確認 |
| UI テスト | `app/apps/portal-shell/src/auth-ui.test.ts` | ドロップダウンと代理操作を確認 |
| Gateway テスト | `app/gateway/auth-controller.test.mjs` | 開始、終了、権限不足を確認 |
