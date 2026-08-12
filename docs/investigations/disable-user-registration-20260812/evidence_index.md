# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| ログイン画面にユーザー登録を表示しない | `app/apps/portal-shell/src/AuthPage.tsx`、Portal Auth UI 試験、正式 Browser DOM | 高 | Screenshot は入力値を脱敏して保存 |
| Portal が自己登録を呼び出さない | `AuthPage.tsx` から `registerLocalAccount` を削除、`auth-ui.test.ts` と API Client の静的検証 | 高 | なし |
| Gateway の公開登録を拒否する | `app/gateway/auth-controller.mjs`、`auth-controller.test.mjs` | 高 | なし |
| Spring の公開登録を拒否する | `AuthController.java`、`RoleApiTest.java`、`GlobalExceptionHandler.java` | 高 | なし |
| 管理者によるユーザー追加を維持する | `auth-controller.mjs` の `POST /users`、`identity-database.mjs` の `createManagedUser` | 高 | 今回は管理者追加経路を変更していない |
| Windows SSO 自動作成を維持する | `identity-database.mjs` の `provisionWindows`、SSO 試験 | 高 | 今回は SSO 経路を変更していない |
| 正式ログイン画面に反映された | `docs/evidence/disable-user-registration-20260812.png`、HTTPS 200、正式 Browser DOM | 高 | Browser は既存認証済みセッションからログアウトし、入力値を脱敏して確認 |
| 公開登録が実行時に拒否される | 8092 の実応答 `403 REGISTRATION_DISABLED` | 高 | 実データ作成は行っていない |
| 静的配信が成功した | `app/logs/continuous-delivery.log` の `delivery_succeeded reason=disable-user-registration-20260812-static` | 高 | rolling reload は Windows OpenEvent 権限で失敗 |
