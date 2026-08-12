# HTTP から HTTPS への転送調査報告

## 目的

OneOps の80番 Port への接続を443番 Port の HTTPS 入口へ統一する。

## 変更前の状態

`conf/nginx.conf` は `192.168.20.54:443 ssl` だけを定義していた。実行環境も443番 Port だけを待受し、80番 Port には Listener が存在しなかった。

## 実装

80番 Port 専用の `server` Block を追加し、全 Request に `308 Permanent Redirect` を返す。転送先は `https://$host$request_uri` とし、Host、Path 及び Query String を保持する。`$http_host` は元の `:80` を含む可能性があるため使用しない。

## 変更境界

443番 Port の TLS、Portal、API、WebDAV、管理 WebDAV、Backend Upstream 及び認証処理は変更対象外とする。

## 実行時受入

1. Nginx の直接 Reload は SYSTEM Process の Global Event へアクセスできず、`Access is denied` となった。
2. `Nginx HTTPS Gateway` 計画 Task の停止後、Master Process は終了したが、443番 Port を保持する Worker Process だけが孤立した。Executable Path、Command Line、Parent Process 不在及び443番 Listener を確認して対象 Worker だけを終了し、SYSTEM 計画 Task を再起動した。
3. 新しい Nginx Worker は `192.168.20.54:80` と `192.168.20.54:443` の両方を待受した。
4. Root、Path と Query を含む GET、API Path と Query を含む POST は全て `308 Permanent Redirect` を返し、Location は同じ HTTPS Host、Path 及び Query String と一致した。
5. `TS2DEVSERVER` と `localhost` の Host Header も同じ HTTPS Host、Path 及び Query String へ転送した。
6. HTTPS Portal は HTTP 200、Health は `UP`、Backend は `0.18.20`、`online=true`、`legacyGatewayReady=true` だった。
7. 実 Browser は `http://192.168.20.54/http-redirect-acceptance?source=browser` から同じ HTTPS URL へ遷移した。Application Console の Warning と Error は0件だった。
8. Browser Screenshot は通常取得と固定 Viewport 取得の両方で Layout Metrics の Timeout となり、Chrome は未接続だったため `evidence_missing` とする。
