# 完了回执

対象: OneOps 常時稼働

版数: 0.5.1

実施内容:

* Docker Desktop、PostgreSQL、Gateway、自動 SSO、Nginx HTTPS の 30 秒監視を追加。
* 開機時と運用ユーザーログオン時の開始、異常終了時の再起動を設定。
* PostgreSQL 外部ボリューム消失時の安全停止を実装。
* PostgreSQL、Gateway、Docker Desktop の停止からの自動復旧を受入試験。
* 公開画面、版数、Console、スクリーンショットを検証。

完了判定:

* ローカル常時稼働対策は実装、インストール、テスト済み。
* OneOps Health は UP。
* 自動 SSO 実効設定は有効。
* ユーザーと Windows 外部アイデンティティは各 12 件を維持。

残る運用確認:

* 次回の計画再起動時に、開機とログオンからの完全復旧時刻を運用ログで確認。
* TOKYO ドメインへログオン済み Edge で自動ログイン完了を確認。
