# Windows SSO 高速復帰調査

## 要求

Windows SSO は成功時に即時反映し、非ドメイン端末、認証失敗又は長時間応答なしの場合はユーザー名及びパスワードのログインへ速やかに復帰する。

## 原因

従来の初回認証は `window.location.replace` で OneOps 画面全体を EnvPortal SSO へ移動していた。非ドメイン端末では SSO Endpoint が `401` と `WWW-Authenticate: Negotiate, NTLM` を返し、OneOps への `Location` を返さないため、OneOps 側の復帰処理を実行できなかった。

## 実装

Nginxの同一Origin静的SSO入口から非表示認証Frameで SSO を開始し、主画面はローカルログインフォームを維持する。300ms 間隔で Session を更新し、成功を即時反映する。5秒経過時に認証Frameを停止し、ローカルログイン案内を表示する。利用者へ追加の認証画面及びPopupを表示しない。
