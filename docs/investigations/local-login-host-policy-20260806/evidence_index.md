# 証拠一覧

| ID | 主張 | 証拠 | 状態 |
| --- | --- | --- | --- |
| L1 | 本番ホストは SSO を無効化する | `app/scripts/ensure-oneops-runtime.ps1` | 確認済み |
| L2 | 正式 API はローカルログイン契約を返す | `/api/work-center/v1/auth/config` | `false`、`false`、空 URL |
| L3 | 巡検はローカルログインを維持する | `ensure-oneops-runtime.ps1` 実行結果 | `AuthenticationMode=LOCAL` |
| L4 | 配信と巡検は同じ Mutex ACL を使用する | `publish-portal.ps1`、`ensure-oneops-runtime.ps1` | SYSTEM、Administrators |
| L5 | 正式 Browser はローカルログインへ到達する | Browser DOM、Console | SSO 表示 0、Error 0、Warning 0 |
| L6 | 認証後の顧客スキャン画面へ到達する | `customer-scan-learning-gap.png` | 確認済み |
