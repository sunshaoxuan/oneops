# 試験結果

更新日：2026-08-03

## 完了

- Python 構文確認：成功
- 構築器単体試験：12 件成功
- OneOps 完全試験：Gateway 147 件、Portal 124 件、Builder 12 件、合計 283 件成功
- 本番ビルド：成功。Vite の既存チャンクサイズ警告のみ
- 正式テンプレート PowerShell Parser：`install.ps1`、`util.ps1`、`suite.install.ps1` の解析エラー 0 件
- RustFS `1.0.0-beta.12` 実配布物：取得、正規化、実行を確認。Windows の rename ロック競合により業務要求と Console が 503 となる事象を確認
- RustFS `1.0.0-beta.11` 実配布物：API health 200、Console `/rustfs/console/index.html` 200
- OneHrStandalone 実成果物：`rustfs.zip`、`rustfs.exe`、`start.bat`、版数メタデータ、`mid-rustfs` NSSM 登録、条件付きインストールを確認
- MinIO 非選択時の `minio.zip` 不在を確認
- Browser 実画面：MinIO の右隣に RustFS、Azure Blob Storage は次行、RustFS の初期版数 `1.0.0-beta.11` を確認
- Browser 操作：MinIO と RustFS の双方向排他、未選択時の RustFS 版数無効化、選択時の有効化を確認
- Browser コンソール：warning 0 件、error 0 件
- スクリーンショット：`docs/evidence/product-builder-rustfs-20260803.png`
- 配信：版数同期後の最終配信が 2026-08-04 00:00:29 に成功
- 固定ポート：443 と 8092 が使用可能、8091 は未使用
- Gateway health：200、状態 `UP`
- SSO：設定 API 200、既存ブラウザーセッションでログイン状態と製品構築画面への遷移を確認
- スケジュールタスク：OneOps Continuous Delivery、OneOps Runtime Supervisor ともに Ready

## 配信切替時の観測

2026-08-04 00:00:21 と 00:00:26 に、配信切替中の Builder API 応答を既存画面が JSON として解析した一時エラーを二件記録した。配信完了後に新規タブで再確認し、OneOps `0.8.5`、構築器 `0.7.4-oneops`、RustFS 表示、双方向排他が正常で、warning と error は 0 件だった。
