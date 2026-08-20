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
7. Account Key と Connection String がタスク metadata、設定履歴及び公開 Job request へ保存されることを確認した。
8. 専用資格情報ファイルを作成せず、保存済み request を最終構築処理が直接利用することを確認した。
9. Account Key と Connection String が Proxy 設定へ入らないことを確認した。
10. `config.ini` の Azure 項目は既存値を置換し、欠落値を追加し、同一 Key を一件へ正規化することを確認した。
11. 最終 `OneHrStandalone.zip` 内の `software/web.zip` と `bin/kernel/config.ini` を再読込して選択結果と Azure 設定を確認した。

## Azure 設定グループと履歴保存試験

1. Azure 有効化欄と六項目が同じ全幅 Group の子要素であることを確認した。
2. Azure 未選択時は専用入力領域が非表示であり、選択時は同じ Group 内で表示される DOM、CSS 及び JavaScript 契約を確認した。
3. テスト用 Key と Connection String が Job metadata、設定履歴及び公開 Job request に同一値で保存されることを確認した。
4. `fillFormFromRequest()` が Password Input を含む名前付き入力へ保存値を設定することを確認した。
5. `azure-credentials.json` が生成されないことを確認した。
6. 聚焦 Builder 試験 32 件と Python compile が成功した。
7. 全体試験は Gateway 326 件、Builder 32 件、Portal 47 files と 278 件及び production build が成功した。

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

実ファイル名対応後は Builder 31 件、Gateway 326 件、Portal 47 files と 278 件及び production build が成功した。

## アップロード実ファイル名試験

1. 画面 JavaScript が証明書と Key の `File.name` を各名称欄へ同期し、Payload に同じ値を設定することを確認した。
2. `wildcard.crt` と `wildcard.key` がタスク専用 TLS ディレクトリへ同名で保存されることを確認した。
3. `web.zip` の `ohr-cicd/conf_prod` に同名で収録され、旧 `server.crt` と `server.key` が残らないことを確認した。
4. `nginx.conf` と `nginx_https.conf` が `wildcard.crt` と `wildcard.key` を参照することを確認した。
5. 最終 `OneHrStandalone.zip` 内の `software/web.zip` を再読込し、同じ資材名を確認した。
6. 経路文字、不正拡張子、Windows 保留名、空白及び証明書と Key の同名を拒否することを確認した。

Vite の chunk size warning は発生した。production build の終了コードは 0 だった。

## UI と Runtime

1. HTTPS 443、OneOps 8092、内部橋接 8093 の Listen を確認した。8091 は Listen していない。
2. 正式 HTTPS Health は `UP`、Runtime Version は `0.18.23` だった。
3. Continuous Delivery は 2026 年 8 月 20 日 16 時 54 分 35 秒に成功し、新 Builder worker は同日 16 時 54 分 23 秒に起動した。
4. Edge と内蔵 Browser はログイン画面を表示した。認証済み製品構築画面、Console 及び Screenshot は `evidence_missing` として残す。
5. 実ファイル名対応後も制御可能な認証済みタブが存在しないため、`wildcard.crt` と `wildcard.key` の実選択 Screenshot は `evidence_missing` として残す。

## Nginx と Redis のポート試験

1. 画面に Nginx 80、443、8005、8006 と Redis 6379 の既定値が存在し、固定 Readonly 処理がないことを確認した。
2. API が各ポートを数値へ正規化し、範囲外、五項目間の重複及び OHR 3198 との重複を拒否することを確認した。
3. Nginx 18080 と 18443 が主設定と HTTPS 設定へ反映され、18443 が Redirect と Portal Origin に入ることを確認した。
4. Dumi Basic 18005 と Dumi Nocode 18006 が各 Nginx 設定へ反映されることを確認した。
5. `cicd.json` の `hostPort` が 18080 へ更新されることを確認した。
6. Redis 16379 が最終 `config.ini` と内包 `redis.windows.conf` へ反映されることを確認した。
7. 最終 `OneHrStandalone.zip` から `software/web.zip` と `software/redis.zip` を再読込して全値を検証した。
8. ポート対応後の最終全体試験は Gateway 326 件、Builder 32 件、Portal 278 件及び production build が成功した。
9. Continuous Delivery は 17 時 47 分 52 秒に成功し、新 Builder worker、443、8092、8093 の Listen、8091、8094、8095 の非 Listen及び正式 Health `UP` を確認した。
