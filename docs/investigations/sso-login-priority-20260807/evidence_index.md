# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| ローカルログインだけが表示された | `auth/config` が `windowsSsoEnabled=false`、`windowsSsoAutoLogin=false`、空 URL を返した | 高 | 修正前の正式ランタイム |
| Runtime Supervisor が SSO を無効化していた | `app/scripts/ensure-oneops-runtime.ps1` の `Enable-LocalLogin` 実装と自己検査 | 高 | 変更前の実装 |
| SSO 入口が到達可能である | `OHR0067:8998` TCP 接続成功、SSO URL の匿名応答 401 | 高 | 未認証アクセスの結果 |
| プロファイル検証端点が到達可能である | `192.168.20.38:8999/auth_windows.jsp` HTTP 200 | 高 | 認証済み Windows 主体は未投入 |
| 正式設定が SSO 有効へ復旧した | `auth/config` が `windowsSsoEnabled=true`、`windowsSsoAutoLogin=true`、正規 SSO URL を返した | 高 | Runtime Supervisor 一回巡検で確認 |
| SSO 優先とローカル回退を実装した | `ensure-oneops-runtime.ps1`、`AuthPage.tsx`、関連テストと要件文書 | 高 | 実ドメイン成功は未確認 |
| SSO 失敗後にローカルフォームと SSO ボタンが残る | 隔離ブラウザーの回跳 URL、DOM スナップショット、`sso-fallback-login.png` | 高 | モック失敗回跳を使用 |
| ブラウザー Console に実行時エラーがない | `tab.dev.logs()` が debug と info のみ | 中 | 拡張機能由来の情報ログを含む |
