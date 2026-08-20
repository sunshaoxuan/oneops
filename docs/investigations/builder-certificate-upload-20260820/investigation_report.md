# HTTPS 証明書アップロード調査報告

## 目的

OneOps の製品構築で証明書及び秘密鍵をアップロードし、生成設定と正式資材へ一体化して、インストール後に追加配置なしで HTTPS サービスを起動できるようにする。

## 現行経路

1. 製品構築画面には証明書名と Key 名だけがあり、ファイル入力は存在しなかった。
2. ビルド端末は HTTPS 用 `nginx.conf` と `nginx_https.conf` を `web.zip` の `ohr-cicd/conf_prod` に生成する。
3. ビルド端末の現行契約は `server.crt` と `server.key` を参照する。
4. OneHrStandalone のインストーラーは `software/web.zip` を Nginx 実行ディレクトリへ展開する。
5. 証明書ファイル自体を `web.zip` に収録する処理が存在しないため、従来資材だけでは HTTPS 起動に必要なファイルが不足する。

## 実装方針

- 原始 droneci の構築処理を変更せず、OneOps が取得した `web.zip` にアップロード資材を挿入する。
- 固定配置名を `server.crt` と `server.key` に統一する。
- 二つの Nginx 設定を検査し、TLS ディレクティブを固定名へ統一する。
- 秘密鍵本文を永続 metadata、設定履歴、ログ及び Git から除外する。
- PEM 形式、サイズ及び証明書と秘密鍵の組合せを受理時に検証する。

## 影響範囲

- `app/builder/host_standalone_console.py`
- `app/builder/standalone_packager.py`
- `app/builder/oneops_worker_test.py`
- `docs/PRODUCT_BUILDER_REQUIREMENTS.md`

原始 `D:\workspace\droneci` は読取調査だけとし、変更対象に含めない。

## Azure Blob Storage 追加調査

1. 従来の `api-proxy.conf` は MinIO と RustFS の Block を同時に有効化し、Azure Block だけを注釈化していた。
2. Azure Block の `proxy_pass` と `Host` は `undefined` のままであり、利用者が設定できる画面項目は存在しなかった。
3. Private Endpoint の IP と公開 Blob Host は用途が異なる。接続先は `proxy_pass`、Blob Host は HTTP Host と TLS SNI に使用する必要がある。
4. `/azure/` の後続 Path は指定コンテナ配下へ変換する必要がある。
5. Azure の資格情報は Nginx Proxy 自体では使用しない。インストール後の業務サービス用に `config.ini` へ保持する。

実装は OneOps が取得した `web.zip` の二つの代理設定を選択結果に従って書き換え、最終 Standalone 設定へ Azure 値を追加する。原始 droneci の生成処理は変更しない。

## Azure 設定グループと履歴保存の利用者訂正

初回実装では Azure の有効化欄をミドルウェアの二列 Grid へ直接配置したため、RustFS のバージョン欄と同じ行へ表示された。Azure 六項目との視覚的な所属も分断された。修正後は有効化欄と六項目を全幅の `azure-storage-group` 内へまとめ、選択状態に応じてグループ内の入力領域だけを表示する。

初回の資格情報契約は Key と Connection String をタスク metadata と設定履歴から除外し、タスク専用ファイルへ分離していた。利用者から構築設定として保存し再利用する要求が明示されたため、この分離を削除した。両値は正式な request、metadata 及び設定履歴へ保存し、既存の `fillFormFromRequest()` により Password Input へ回填する。実行ログ、Nginx 代理設定、公開証拠及び Git へ資格情報本文を出力しない境界は維持する。

## アップロード実ファイル名の不一致

利用者の実画面では `wildcard.crt` と `wildcard.key` を選択した後も、WEB 証明書名と WEB Key 名が `server.crt` と `server.key` のまま表示された。原因は画面にファイル選択 Event の同期処理がなく、受理処理と封包処理も固定名へ上書きしていたことである。

修正後は選択した `File.name` を画面表示と Payload へ設定し、Server で安全な単一ファイル名として検証する。タスク専用保存、`web.zip` への収録、`nginx.conf`、`nginx_https.conf` 及び最終 Standalone 内包まで同じ実ファイル名を使用する。既に旧固定名が入った `web.zip` を再処理する場合は `server.crt` と `server.key` を除去する。

## Nginx と Redis のポート調査

最新の実構築資材と原始生成経路を照合した結果、正式生成物の Nginx 主 HTTP は `80`、HTTPS は `443`、Dumi Basic は `8005`、Dumi Nocode は `8006` だった。原始 `conf_prod_template/nginx.conf` の `40443` は生成前の静的 Template 値であり、正式生成器は `CONF_WEB_PORT` の既定値 `80` を使用する。

Redis の `6379` は最終 `config.ini`、同梱 `redis.windows.conf` 及び Redis Addon に存在する。インストール処理は `config.ini` の `REDIS_PORT` を Redis 起動環境へ渡し、同じ値を業務 Backend の `INFRA_REDIS_PORT` へ渡す。したがって最終 `config.ini` を単一の呼出契約とし、同梱又は差替 Redis ZIP の設定値も同じ値へ正規化する。

Nginx は `conf_prod` の四つの Listen、Portal Origin、非標準 HTTPS Port の Redirect 及び `cicd.json` が利用者入力を参照する。OneOps は原始 droneci を変更せず、取得済み `web.zip` と最終 Standalone を封包時に同じ選択値へ正規化する。
