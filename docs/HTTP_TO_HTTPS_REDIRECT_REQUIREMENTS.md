# HTTP から HTTPS への転送要件

更新日: 2026-08-12

## 1. 目的

OneOps の公開入口へ HTTP で接続した利用者を HTTPS へ統一し、80番 Port に画面又は API を直接配信しない。

## 2. 転送契約

1. `192.168.20.54:80` は HTTP だけを受け付ける。
2. 全ての HTTP Request は Status `308 Permanent Redirect` を返す。
3. 転送先 Scheme は `https` とし、既定の443番 Port を使用する。
4. 転送先 Host、Path 及び Query String は元の Request と一致させる。
5. 元の Authority に含まれる `:80` は転送先へ引き継がない。
6. HTTP 側では Portal、Asset、API、WebDAV 及び管理 WebDAV の内容を配信しない。
7. HTTPS 443番 Port の既存 TLS、Portal、API 及び WebDAV 契約は変更しない。

## 3. 検証

1. Nginx の構文検査が成功すること。
2. 専用の設定回帰試験が成功すること。
3. `http://192.168.20.54/` が HTTPS の同一 Path へ転送されること。
4. Path と Query String を含む HTTP Request が同じ値を保持して転送されること。
5. 80番及び443番 Port が待受状態であること。
6. HTTPS Portal と Health が引き続き正常に応答すること。

## 4. ロールバック

80番 Port 用の `server` Block を削除し、Nginx の構文検査と Reload を実行する。HTTPS 443番 Port の設定、証明書、Backend、Database 及び利用者 Session は変更しない。
