# 最終受領記録

## 完了内容

Spring Boot 移行で失われた EnvPortal SSO 設定契約を復旧し、正式環境へ `0.8.7` として配信しました。認証設定 API は有効な SSO URL を返し、Runtime Supervisor も再登録して稼働中です。

## 検証

Gateway、Portal、Python Worker、Spring Boot、データベース統合、運用スクリプト、production build、実行 JAR、Nginx、HTTPS、正式画面を確認しました。

## 残る確認

自動化ブラウザーが旧 HTTP Windows 統合認証入口を遮断する制約があるため、通常の Windows Edge で実ドメインユーザーのログイン完了を再確認します。
