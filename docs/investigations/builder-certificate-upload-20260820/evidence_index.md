# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| 従来画面はファイルを送信しない | `host_standalone_console.py` の旧証明書名入力 | 高 | 修正前ソース確認 |
| HTTPS 設定の配置 | 実成果物 `web.zip/ohr-cicd/conf_prod` | 高 | 既存成功構築資材を確認 |
| インストール時の展開先 | テンプレート `util.ps1` の `Unzip-Nginx` | 高 | テンプレート実装確認 |
| TLS 設定の原始生成 | ビルド端末の生成処理と Nginx 設定 | 高 | 原始 droneci を読取確認 |
| 秘密鍵非永続化 | OneOps unit test と job metadata 検査 | 高 | Builder 31 件に含む |
| 最終資材への収録 | `web.zip` と内包 `OneHrStandalone.zip` 検査 | 高 | 二重 ZIP の再読込試験済み |
| 従来の三種代理状態 | `build-console/conf_prod_template/api-proxy.conf` | 高 | MinIO と RustFS が有効、Azure が `undefined` で注釈状態 |
| Azure Private Endpoint 契約 | 接続先、Blob Host、Container の分離実装 | 高 | 二つの Proxy 設定と最終 ZIP で検証 |
| ストレージ単一選択 | UI change handler と `validate_job_payload()` | 高 | 四状態と繰返し書換を検証 |
| Azure 秘密値非公開 | `azure-credentials.json`、metadata、履歴、公開 Job の検査 | 高 | Account Key と Connection String を試験値で検証 |
| Azure 設定の一意性 | `update_config_ini()` の置換、追加、重複除去試験 | 高 | 二回実行後も各 Key 一件 |
| OneOps 全体回帰 | `pnpm check` | 高 | Gateway 326、Builder 31、Portal 278、production build 成功 |
| 固定 Runtime | Listen と正式 HTTPS Health | 高 | 443、8092、8093 が Listen、8091 は非 Listen、Health `UP` |
| 認証後 UI | Browser、Console、Screenshot | 低 | `evidence_missing`。Edge と内蔵 Browser はログイン画面 |
| 正式配信 | Continuous Delivery Log と Runtime Worker | 高 | 16 時 54 分 35 秒成功、新 Worker は 16 時 54 分 23 秒起動 |
| 実ファイル名不一致の原因 | `syncHttpsUploadState()`、`extract_tls_uploads()`、`inject_tls_assets_into_web_zip()` の修正前契約 | 高 | 画面同期なし、Server と封包が固定名 |
| 実ファイル名の全経路統一 | Builder 単体試験と二重 ZIP 再読込 | 高 | `wildcard.crt` と `wildcard.key` で検証 |
| 不正ファイル名拒否 | `validate_tls_asset_filename()` と単体試験 | 高 | 経路、拡張子、Windows 保留名、空白及び同名を検査 |
| ファイル名 UI | 認証後 Browser、Console、Screenshot | 低 | `evidence_missing`。制御可能な認証済みタブなし |
