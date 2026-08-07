# Windows SSO 優先とローカルログイン回退の調査記録

更新日: 2026-08-07

## 初期要求

ドメインにバインドされた利用者が OneOps を開いた場合、最初に Windows SSO を試行する。SSO が失敗した場合は同じ画面で OneOps のユーザー名とパスワードによるログインへ戻す。SSO が利用可能な構成では、ローカルログイン画面に SSO ボタンを表示する。

## 原因

正式 API の `/api/work-center/v1/auth/config` は次の状態を返していた。

```json
{"windowsSsoEnabled":false,"windowsSsoAutoLogin":false,"windowsSsoUrl":""}
```

`app/scripts/ensure-oneops-runtime.ps1` が Runtime Supervisor の巡検時に `OPS_ENVPORTAL_SSO_URL`、`OPS_ENVPORTAL_PROFILE_URL`、`OPS_WINDOWS_SSO_PROXY_URL` を空にし、`OPS_SSO_AUTO_LOGIN=false` を設定していた。`AuthPage.tsx` は API の `windowsSsoEnabled` が false の場合に SSO ボタンを描画しないため、ローカルログインフォームだけが表示されていた。

## 修正

1. Runtime Supervisor が EnvPortal SSO URL とプロファイル検証 URLを正規値へ戻し、`OPS_SSO_AUTO_LOGIN=true` を維持するようにしました。
2. Runtime Supervisor の自己検査、運用スクリプト検査、インストール説明を自動 SSO 前提へ更新しました。
3. `AuthPage.tsx` の既存フローを現行要求へ対応付けました。初回表示では `windowsSsoAutoLogin` と URL が有効な場合に一度だけ SSO へ遷移し、`sessionStorage` の試行記録後はローカルフォームと SSO ボタンを表示します。
4. 認証要件、常時稼働要件、プロジェクト規則へ SSO 優先とローカル回退を追記しました。

## 構成値

| 項目 | 値 |
| --- | --- |
| EnvPortal SSO | `http://OHR0067:8998/oneops_sso.jsp` |
| プロファイル検証 | `http://192.168.20.38:8999/auth_windows.jsp` |
| 自動ログイン | `true` |
| 許可 UPN ドメイン | `tokyo.scientia.co.jp` |
| 許可 Windows ドメイン | `tokyo` |

## 制約

実ドメイン利用者の Windows 統合認証完了は、現在の自動化ブラウザーが HTTP のドメイン認証入口を処理できるかに依存します。設定 API、SSO 入口の到達性、プロファイル検証端点、認証失敗後のローカル回退、設定 API、SSO ボタン、コンソール、HTTPS は確認済みです。実ドメイン資格情報を自動化ブラウザーへ投入していないため、実ドメイン SSO 成功は未確認です。初回 SSO 待機画面の PNG はブラウザー遷移待機により `evidence_missing` としています。

## 実行時結果

正式設定 API は次を返します。

```json
{"windowsSsoEnabled":true,"windowsSsoAutoLogin":true,"windowsSsoUrl":"http://OHR0067:8998/oneops_sso.jsp"}
```

隔離ブラウザーでは SSO 有効の設定を返す代理へ接続し、自動 SSO 要求を失敗回跳させました。回跳後の DOM にはユーザー名、パスワード、`Windows ドメインでログイン` が存在し、回退画面を `sso-fallback-login.png` として保存しました。ブラウザー Console は Vite 接続と React DevTools の情報ログだけでした。
