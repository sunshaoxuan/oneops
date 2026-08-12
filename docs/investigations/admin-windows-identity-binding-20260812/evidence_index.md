# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| 管理者が Windows Identity をバインドできる | `auth-controller.mjs`、`identity-database.mjs`、対象試験 | 高 | 実 DB 受入は配信後に確認する |
| 同一 Windows Subject とユーザー別 Windows Identity は一意である | Migration 009 の二つの一意制約、Repository 競合判定 | 高 | 本番集計で複数 Windows Identity のユーザーは 0 件 |
| ユーザー物理 ID を参照する | `auth_identities.user_id` 外部キーと Repository 引数 | 高 | なし |
| 許可ドメイン、UPN、機械アカウントを検証する | `validateWindowsIdentityBinding` と純関数試験 | 高 | 許可値は実行時設定に従う |
| 管理者 UI からバインドと解除を操作できる | `IdentityManagementPage.tsx`、Portal 対象試験 35 件成功 | 高 | Browser 受入は配信後に確認する |
| 操作を監査する | `WINDOWS_IDENTITY_ADMIN_LINKED`、`WINDOWS_IDENTITY_ADMIN_UNLINKED` | 高 | 実 DB 監査行は配信後に確認する |
| Gateway 全体との回帰がない | クリーン候補 `359858b1` の Gateway 298 件成功 | 高 | なし |
| Portal の正式 Build が可能である | `tsc -b` と Portal 全量試験 | 低 | AIアシスタント並行変更の不整合により `evidence_missing` |
| Runtime は認証境界を維持する | `PUT /auth/users/{id}/windows-identity` の未認証応答 `401 AUTHENTICATION_REQUIRED` | 高 | 認証済み 400、409、200 は未実施 |
| 正式 Browser は到達可能である | `docs/evidence/admin-windows-identity-binding-sso-waiting-20260812.png`、Console 0 件 | 中 | Windows SSO 確認待機から管理画面へ進まない |
