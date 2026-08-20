# 実行コマンド

## 調査

- `git fetch origin master`
- `rg -n "web_cert_name|web_key_name|conf_enable_https" app/builder D:\workspace\droneci`
- `tar -tf app/builder/.standalone-template/OneHrStandalone.zip`
- 既存成功資材内の `software/web.zip` とインストールスクリプトを確認
- `api-proxy.conf` と debug 版の MinIO、RustFS、Azure Block を確認
- `config.ini` の既存 Middleware 設定項目を確認
- 利用者提示値のアカウント名及び Key Prefix が Repository、Task Log、自増強出力に保存されていないことを検索

## 試験

- `python -m unittest app.builder.oneops_worker_test`
- `python -m py_compile app/builder/host_standalone_console.py app/builder/standalone_packager.py app/builder/oneops_worker.py`
- 一時生成した自己署名証明書と RSA 秘密鍵による `extract_tls_uploads()` の実配対検証
- `PATH=D:\nginx\runtime\node;%PATH%; pnpm check`
- `Get-NetTCPConnection -State Listen` による 443、8091、8092、8093 の確認
- `Invoke-RestMethod -SkipCertificateCheck https://192.168.20.54/api/work-center/v1/health`
- Browser による Edge と内蔵 Browser の認証状態確認
- `rg` による固定 TLS 名、File Input、Payload、タスク保存及び ZIP 注入経路の追跡
- `wildcard.crt` と `wildcard.key` を使用した Builder 単体試験及び二重 ZIP 再読込

初回 `pnpm check` は固定 Node 実行時が PATH にないため試験開始前に停止した。PATH を明示して再実行した。調査用一時ディレクトリが言語試験の検査対象に入ったため、一時ファイルを削除し、最終試験を先頭から再実行した。Azure 追加後の初回全体試験は Nginx 試験 Fixture の注釈行が言語検査対象となって失敗した。Fixture を有効 Block から生成する形へ修正し、全体試験を先頭から再実行して全項目が成功した。

実ファイル名対応後の初回 Builder 試験では、旧固定名の証明書資材が再処理後も ZIP に残ることを検出した。旧固定名を直接除去対象へ追加し、聚焦試験と全体試験を先頭から再実行した。
