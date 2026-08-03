# 証拠索引

| 確認事項 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| MinIO の成果物位置 | `app/builder/standalone_packager.py` の `MIDDLEWARE_IN_STANDALONE_ZIP` | 高 | 現行テンプレートを再確認済み |
| MinIO の解凍とサービス登録 | `.standalone-template/OneHrStandalone.zip` 内の `util.ps1`、`install.ps1`、`suite.install.ps1` | 高 | 実テンプレートを読み取り確認 |
| RustFS Windows ZIP 名 | 公式 GitHub Releases API の Assets | 高 | 2026-08-03 時点 |
| RustFS Windows 起動引数 | RustFS 公式 Windows installation | 高 | 単一ノード単一ディスク |
| `--console-enable` の実契約 | 公式 `1.0.0-beta.12` の `rustfs.exe server --help` | 高 | 文書例との差異を確認 |
| RustFS 既定版 | 公式 `1.0.0-beta.11` の隔離起動、API 200、コンソール 200 | 高 | Windows 単一ノード試験 |
| `beta.12` の既知制約 | 本機隔離起動ログの Windows エラー 32 と 503 | 高 | 上流修正版は将来再検証 |
| S3 接続契約 | テンプレート `install.ps1` の `INFRA_MINIO_*` | 高 | 業務サービスの変数名は維持 |
| UI 配置と排他操作 | `docs/evidence/product-builder-rustfs-20260803.png` と Browser 操作結果 | 高 | 配信後の OneOps `0.8.5` で確認 |
| RustFS ZIP 生成 | `app/builder/standalone_packager.py`、`app/builder/addons/rustfs/start.bat`、正式 OneHrStandalone 実成果物 | 高 | `rustfs.zip`、起動スクリプト、版数メタデータを確認 |
| 固定ポート | `Test-NetConnection` の結果 | 高 | 443 と 8092 が使用可能、8091 は未使用 |
| SSO 回帰 | 認証設定 API と認証済み Browser 画面 | 高 | 設定 API 200、製品構築画面へ遷移可能 |
| 安定時コンソール | 配信完了後に開いた新規 Browser タブ | 高 | warning 0 件、error 0 件 |
