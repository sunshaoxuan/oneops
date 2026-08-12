# 最終受入記録

状態: HTTP 転送、Nginx Runtime、HTTPS、Browser URL、Console 及び対象差分の Version 管理は合格。Screenshot は `evidence_missing`。

## 実装結果

* `192.168.20.54:80` は全 Request を `308 https://$host$request_uri` へ転送する。
* Path、Query String 及び HTTP Method の意味を保持する。
* 443番 Port の TLS、Portal、API、WebDAV 及び Backend Upstream は変更していない。

## 実行時結果

* 80番と443番 Port は新しい SYSTEM Nginx Worker が待受している。
* Root、深い Path と Query の GET、API Path と Query の POST は全て正しい Location を返した。
* HTTPS Portal は200、Health は `UP / 0.18.20`、Backend Online と Legacy Gateway Ready は `true` だった。
* Browser は HTTP URL から同じ HTTPS Path と Query へ遷移し、Application Console Warning と Error は0件だった。
* Browser Screenshot は Layout Metrics Timeout のため `evidence_missing` である。

## Version 管理

`conf/nginx.conf`、専用 Test、要件文書及び専用調査証拠の9ファイルだけを Staged Whitelist とした。既存の他タスク差分は対象外として維持する。

## データ保護

Backend、Database、Role、Session、Portal Asset 及び証明書は変更していない。

## ロールバック

80番 Port 用 Server Block、専用 Test 及び関連文書を取り消し、SYSTEM の Nginx 計画 Task を再起動する。443番 Port、Backend、Database 及び Session は維持する。
