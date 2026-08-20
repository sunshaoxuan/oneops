# 試験結果

## 聚焦単体試験

- HTTPS の証明書と秘密鍵の必須検証
- 秘密鍵を metadata と設定履歴へ保存しない検証
- `web.zip` への TLS 資材収録と Nginx 設定書換検証
- OneOps 画面のアップロード入力と Base64 送信検証

結果は 4 件成功した。最終 Builder 全体試験にも含めた。

## 実証試験

- 実行時に生成した自己署名証明書と暗号化されていない RSA 秘密鍵を Python `ssl.SSLContext.load_cert_chain()` で読み込み、実配対を受理した。
- 単体試験用 `web.zip` に証明書、秘密鍵及び二つの Nginx 設定を生成した。
- 同じ `web.zip` を `OneHrStandalone/software/web.zip` へ内包し、二重 ZIP の最終位置から証明書と秘密鍵を再読込した。
- metadata と設定履歴に Base64、PEM ヘッダー及び秘密鍵本文が存在しないことを確認した。

## 全体試験

- Gateway: 326 件成功
- Builder: 22 件成功
- Portal: 47 files、278 件成功
- Portal production build: 成功
- Python compile: 成功

Vite の chunk size warning は発生した。production build の終了コードは 0 だった。

## UI と Runtime

正式配信後に Browser、Console、Screenshot 及び固定端口を確認する。
