# テスト結果

## 自動検査

| 対象 | 結果 |
| --- | --- |
| Runtime Supervisor 自己検査 | 合格。`Valid=true`、正規 SSO URL、プロファイル URL、自動 SSO、秘密値保持を確認 |
| 運用スクリプト検査 | 合格。9 スクリプト解析、Runtime Supervisor、Mutex ACL、原子的公開を確認 |
| Gateway 認証テスト | 205 件合格、失敗 0 件、スキップ 0 件 |
| Python Builder テスト | 14 件合格、失敗 0 件 |
| Portal 認証 UI テスト | 18 ファイル、157 件合格、失敗 0 件。ログアウト後の自動 SSO 抑止を含む |
| Portal Vite 本番ビルド | 合格。3,408 モジュール変換、Vite build 完了 |
| Portal TypeScript を含む本番ビルド | 合格。TypeScript と Vite build 完了。既存の並行変更を含む現行作業ツリーで確認 |

## 実行時検査

| 確認項目 | 結果 |
| --- | --- |
| 修正前 `auth/config` | `windowsSsoEnabled=false`、`windowsSsoAutoLogin=false`、URL 空 |
| 修正後 `auth/config` | `windowsSsoEnabled=true`、`windowsSsoAutoLogin=true`、`http://OHR0067:8998/oneops_sso.jsp` |
| Runtime Supervisor 一回巡検 | `Ready=true`、Database `healthy`、Gateway `Running`、AutomaticSso `true`、SsoProxy `true`、Https `true` |
| OHR0067 8998 | TCP 接続成功、匿名 HTTP は 401 |
| プロファイル検証端点 | HTTP 200、`application/json` |
| OneOps HTTPS | HTTP 200、Portal title を確認 |
| 登出 API | ローカル認証フィクスチャで 1 回呼び出し、認証状態を未認証へ変更 |

## ブラウザー検査

| 確認項目 | 結果 |
| --- | --- |
| 初回入口 | 隔離ページで自動 SSO 遷移を開始し、`Windows ドメイン認証を確認しています。` の表示を確認 |
| SSO 失敗回退 | 失敗回跳プロキシから `http://127.0.0.1:5186/?sso=failed` へ戻り、ユーザー名、パスワード、SSO ボタンを DOM で確認 |
| SSO ボタン | `Windows ドメインでログイン` が表示され、設定 API の SSO 有効値と一致 |
| Console | エラーなし。Vite 接続と React DevTools の情報ログのみ |
| 回退画面スクリーンショット | `sso-fallback-login.png` を保存 |
| ログアウト後ログイン画面スクリーンショット | `logout-login-page.png` を保存。ユーザー名、パスワード、SSO ボタンを表示 |
| ログアウト後の自動 SSO | 1.6 秒待機後も URL は `/` のまま、SSO 入口への自動要求は 0 件 |
| 手動 SSO ボタン | ローカル認証フィクスチャで SSO 入口への要求を 1 件記録 |
| 初回 SSO 待機画面スクリーンショット | `evidence_missing`。画面遷移待機中にブラウザー API が最終回退画面まで待機するため、安定した PNG を取得できなかった |
| 実ドメイン SSO 成功 | 未確認。自動化ブラウザーへ Windows ドメイン資格情報を投入していない |
