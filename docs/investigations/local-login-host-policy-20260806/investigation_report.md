# 本番ホストのローカルログイン固定化

更新日: 2026-08-06

## 結論

本番ホストでは Windows SSO を使用しない。未認証時は OneOps のユーザー名とパスワードによるログイン画面を直接表示する。

従来の Runtime Supervisor は `OPS_SSO_AUTO_LOGIN=true` と EnvPortal SSO 接続先を 30 秒ごとに復旧していたため、ブラウザーが未暗号化 HTTP の SSO 接続先で停止した。Runtime Supervisor の正本契約をローカルログインへ変更し、SSO URL、Profile URL、Windows SSO Proxy URL を空にし、`OPS_SSO_AUTO_LOGIN=false` を維持するよう修正した。

継続配信と Runtime Supervisor の全局 Mutex は SYSTEM と Administrators に FullControl を付与する。同一 ACL を両側で使用し、配信中の巡検は権限エラーではなく安全な見送りとして処理する。

## 実行経路

1. `OneOps Runtime Supervisor` が `.env.local` の認証設定を原子的に更新する。
2. 設定変更時に Gateway を再起動する。
3. `/api/work-center/v1/auth/config` が SSO 無効状態を返すまで待機する。
4. Portal は SSO 自動遷移条件を満たさず、ローカルログイン画面を表示する。

## 確認結果

正式 API は `windowsSsoEnabled=false`、`windowsSsoAutoLogin=false`、`windowsSsoUrl=""` を返した。正式 Browser はユーザー名とパスワードのフォームを直接表示し、Windows、SSO、ドメイン認証の表示件数は 0 件であった。ログイン後の顧客情報画面と CAG Learning Gap も確認した。
