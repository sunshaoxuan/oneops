# Windows SSO 優先とローカルログイン回退の調査記録

更新日: 2026-08-07

## 初期要求

ドメインにバインドされた利用者が OneOps を開いた場合、最初に Windows SSO を試行する。SSO が失敗した場合は同じ画面で OneOps のユーザー名とパスワードによるログインへ戻す。SSO が利用可能な構成では、ローカルログイン画面に SSO ボタンを表示する。

ログイン済みユーザーの明示的なログアウトはセッションを破棄し、同じタブのログイン画面へ戻す。ログアウト後も SSO ボタンを残し、同じタブで自動 SSO を再実行しない。自動認証の記録を持たない新しいタブでは初回自動 SSO を維持する。

## 原因

正式 API の `/api/work-center/v1/auth/config` は次の状態を返していた。

```json
{"windowsSsoEnabled":false,"windowsSsoAutoLogin":false,"windowsSsoUrl":""}
```

`app/scripts/ensure-oneops-runtime.ps1` が Runtime Supervisor の巡検時に `OPS_ENVPORTAL_SSO_URL`、`OPS_ENVPORTAL_PROFILE_URL`、`OPS_WINDOWS_SSO_PROXY_URL` を空にし、`OPS_SSO_AUTO_LOGIN=false` を設定していた。`AuthPage.tsx` は API の `windowsSsoEnabled` が false の場合に SSO ボタンを描画しないため、ローカルログインフォームだけが表示されていた。

今回の再現では `AuthPage.tsx` が自動 SSO の試行記録を `sessionStorage` に保存していました。`App.tsx` のログアウト成功処理が同じ記録を設定していなかったため、初回自動認証をまだ試していないタブでは、ログアウト後の未認証画面が直ちに SSO へ遷移する状態でした。

## 修正

1. Runtime Supervisor が EnvPortal SSO URL とプロファイル検証 URLを正規値へ戻し、`OPS_SSO_AUTO_LOGIN=true` を維持するようにしました。
2. Runtime Supervisor の自己検査、運用スクリプト検査、インストール説明を自動 SSO 前提へ更新しました。
3. `AuthPage.tsx` の既存フローを現行要求へ対応付けました。初回表示では `windowsSsoAutoLogin` と URL が有効な場合に一度だけ SSO へ遷移し、`sessionStorage` の試行記録後はローカルフォームと SSO ボタンを表示します。
4. 自動 SSO の試行キーを `WINDOWS_SSO_AUTO_ATTEMPTED_KEY` として共有し、ログアウト成功時にも同じタブの `sessionStorage` へ記録するようにしました。これにより、ログアウト後はローカルフォームと手動 SSO ボタンを表示し、自動 SSO の再跳躍を抑止します。
5. 認証要件、常時稼働要件、プロジェクト規則へ SSO 優先、ローカル回退、ログアウト後の自動 SSO 抑止を追記しました。

## 構成値

| 項目 | 値 |
| --- | --- |
| EnvPortal SSO | `http://OHR0067:8998/oneops_sso.jsp` |
| プロファイル検証 | `http://192.168.20.38:8999/auth_windows.jsp` |
| 自動ログイン | `true` |
| 許可 UPN ドメイン | `tokyo.scientia.co.jp` |
| 許可 Windows ドメイン | `tokyo` |

## 制約

実ドメイン利用者の Windows 統合認証完了は、現在の自動化ブラウザーが HTTP のドメイン認証入口を処理できるかに依存します。設定 API、SSO 入口の到達性、プロファイル検証端点、認証失敗後のローカル回退、設定 API、SSO ボタン、ログアウト後のログイン画面、コンソール、HTTPS は確認済みです。実ドメイン資格情報を自動化ブラウザーへ投入していないため、実ドメイン SSO 成功は未確認です。初回 SSO 待機画面の PNG はブラウザー遷移待機により `evidence_missing` としています。

## 実行時結果

正式設定 API は次を返します。

```json
{"windowsSsoEnabled":true,"windowsSsoAutoLogin":true,"windowsSsoUrl":"http://OHR0067:8998/oneops_sso.jsp"}
```

隔離ブラウザーでは SSO 有効の設定を返す代理へ接続し、自動 SSO 要求を失敗回跳させました。回跳後の DOM にはユーザー名、パスワード、`Windows ドメインでログイン` が存在し、回退画面を `sso-fallback-login.png` として保存しました。ブラウザー Console は Vite 接続と React DevTools の情報ログだけでした。

登出検証用のタスク内ローカル認証フィクスチャでは、認証済みユーザーのメニューから `ログアウト` を実行しました。ログアウト API の呼び出し後、同じタブは URL を `/sso` へ変更せず、ユーザー名、パスワード、`Windows ドメインでログイン` を表示しました。1.6 秒待機後も状態は維持され、Console の警告とエラーは 0 件でした。証拠画像は `logout-login-page.png` です。手動 SSO ボタンのクリックでフィクスチャの SSO 入口への要求も 1 件記録しました。
