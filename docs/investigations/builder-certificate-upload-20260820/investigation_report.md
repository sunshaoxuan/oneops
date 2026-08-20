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
