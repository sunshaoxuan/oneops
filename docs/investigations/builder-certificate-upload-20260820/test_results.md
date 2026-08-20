# 試験結果

## 聚焦単体試験

- HTTPS の証明書と秘密鍵の必須検証
- 秘密鍵を metadata と設定履歴へ保存しない検証
- `web.zip` への TLS 資材収録と Nginx 設定書換検証
- OneOps 画面のアップロード入力と Base64 送信検証

結果は最終 Builder 全体試験にも含めた。

## Azure Blob Storage 試験

1. MinIO、RustFS、Azure Blob Storage の相互排他を API validation で確認した。
2. Azure 選択時の六項目、必須値、Account Name、Container、Endpoint、Blob Host、Base64 Key 及び接続文字列整合性を確認した。
3. Connection String の省略時生成と Blob Host の省略時生成を確認した。
4. MinIO、RustFS、Azure、全て未選択の四状態で、三つの Proxy Block が選択どおり有効又は注釈状態になることを確認した。
5. Proxy Block の書換処理を二回実行し、注釈が増加しないことを確認した。
6. Azure の Container、Endpoint、Host 及び TLS SNI を `api-proxy.conf` と debug 版へ反映することを確認した。
7. Account Key と Connection String が Proxy 設定、metadata、設定履歴及び公開 Job 応答へ入らないことを確認した。
8. `config.ini` の Azure 項目は既存値を置換し、欠落値を追加し、同一 Key を一件へ正規化することを確認した。
9. 最終 `OneHrStandalone.zip` 内の `software/web.zip` と `bin/kernel/config.ini` を再読込して選択結果と Azure 設定を確認した。

## 実証試験

- 実行時に生成した自己署名証明書と暗号化されていない RSA 秘密鍵を Python `ssl.SSLContext.load_cert_chain()` で読み込み、実配対を受理した。
- 単体試験用 `web.zip` に証明書、秘密鍵及び二つの Nginx 設定を生成した。
- 同じ `web.zip` を `OneHrStandalone/software/web.zip` へ内包し、二重 ZIP の最終位置から証明書と秘密鍵を再読込した。
- metadata と設定履歴に Base64、PEM ヘッダー及び秘密鍵本文が存在しないことを確認した。

## 全体試験

1. Gateway は 326 件成功した。
2. Builder は 30 件成功した。
3. Portal は 47 files、278 件成功した。
4. Portal production build は成功した。
5. Python compile は成功した。

Vite の chunk size warning は発生した。production build の終了コードは 0 だった。

## UI と Runtime

1. HTTPS 443、OneOps 8092、内部橋接 8093 の Listen を確認した。8091 は Listen していない。
2. 正式 HTTPS Health は `UP`、Runtime Version は `0.18.23` だった。
3. 現行 Builder worker は本変更前に起動している。全体試験前の watcher 試験は失敗し、正式 Runtime への配信は成立していない。
4. Edge と内蔵 Browser はログイン画面を表示した。認証済み製品構築画面、Console 及び Screenshot は `evidence_missing` として残す。
