# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| 従来画面はファイルを送信しない | `host_standalone_console.py` の旧証明書名入力 | 高 | 修正前ソース確認 |
| HTTPS 設定の配置 | 実成果物 `web.zip/ohr-cicd/conf_prod` | 高 | 既存成功構築資材を確認 |
| インストール時の展開先 | テンプレート `util.ps1` の `Unzip-Nginx` | 高 | テンプレート実装確認 |
| 固定 TLS 名 | ビルド端末の生成処理と Nginx 設定 | 高 | 原始 droneci を読取確認 |
| 秘密鍵非永続化 | OneOps unit test と job metadata 検査 | 高 | 試験結果を追記予定 |
| 最終資材への収録 | `web.zip` と内包 `OneHrStandalone.zip` 検査 | 高 | 試験結果を追記予定 |
