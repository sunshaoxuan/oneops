# 実行コマンド

## 調査

- `git fetch origin master`
- `rg -n "web_cert_name|web_key_name|conf_enable_https" app/builder D:\workspace\droneci`
- `tar -tf app/builder/.standalone-template/OneHrStandalone.zip`
- 既存成功資材内の `software/web.zip` とインストールスクリプトを確認

## 試験

- `python -m unittest app.builder.oneops_worker_test`
- `python -m py_compile app/builder/host_standalone_console.py app/builder/standalone_packager.py app/builder/oneops_worker.py`
- 一時生成した自己署名証明書と RSA 秘密鍵による `extract_tls_uploads()` の実配対検証
- `PATH=D:\nginx\runtime\node;%PATH%; pnpm check`

初回 `pnpm check` は固定 Node 実行時が PATH にないため試験開始前に停止した。PATH を明示して再実行した。調査用一時ディレクトリが言語試験の検査対象に入ったため、一時ファイルを削除し、最終試験を先頭から再実行した。
