# 証拠索引

| 確認事項 | 証拠 | 状態 |
|---|---|---|
| 非ドメイン端末の停止原因 | SSO Endpoint の401、Negotiate及びNTLM、Locationなし | 確認済み |
| OneOps画面を維持する | `AuthPage.tsx` の同一Origin非表示認証Frame | 確認済み |
| 速やかな成功反映 | 300ms Session確認 | 確認済み |
| 応答なしから復帰する | 5秒Timeout及びローカルログイン案内 | 確認済み |
| 正式Browserでローカル復帰する | `docs/evidence/sso-fast-local-fallback-20260812.png` | 合格 |
| ローカルログインを維持する | ユーザー名、パスワード、ログインボタン | 合格 |
| 手動SSOを維持する | Windowsアカウント認証ボタン | 合格 |
| Browser Console | Error及びWarning 0件 | 合格 |
| 正式配信 | `delivery_succeeded reason=sso-fast-local-fallback-20260812` | 合格 |
| 追加SSO画面を表示しない | BrowserのTab数不変、可視Frame 0件 | 合格 |
| 同一Origin静的SSO | HTTPS Endpointが約0.3秒で認証結果を返す | 合格 |
| Nginx及び運用Script | 設定試験、44 Files 255 Tests、運用Script全量 | 合格 |
