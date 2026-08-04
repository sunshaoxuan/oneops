# 試験結果

更新日：2026-08-03

追補日：2026-08-04

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

## 2026-08-04 版数一覧修正

- 障害再現：未認証 GitHub Releases API が 403 `rate limit exceeded` を返し、RustFS の版数一覧が空になった
- 公式入手経路：`https://dl.rustfs.com/rustfs/` から Windows x86_64 固定版 ZIP を 30 件取得
- 公式 CDN 確認：`1.0.0-beta.11` と `1.0.0-beta.12` の ZIP が HEAD 200、Content-Type `application/x-zip-compressed`
- 並び順：`beta.12`、`beta.11`、`beta.10`、`beta.10-preview.3` の順序を確認
- 除外：`rustfs-windows-x86_64-latest.zip` が版数一覧へ入らないことを確認
- 実 ZIP：公式 CDN の `1.0.0-beta.11` を実取得。77,790,646 bytes、`rustfs.exe` 246,142,976 bytes、SHA-256 `E564EA478C969D69EE9B82371B598595FE2B320D5CEDAE60A76A7A089AC228BB`
- 自動試験：Gateway 147 件、Portal 124 件、Builder 12 件、合計 283 件成功
- 本番ビルド：成功
- 最終配信：2026-08-04 11:30:04 成功
- 正式画面：RustFS option 30 件、先頭六件の意味版数順、既定版 `1.0.0-beta.11`、選択時の有効化を確認
- 正式画面コンソール：warning 0 件、error 0 件
- スクリーンショット：`docs/evidence/product-builder-rustfs-official-download-20260804.png`
- 固定ポート：443 と 8092 が使用可能、8091 は未使用
- SSO：既存認証済み Browser セッションで製品構築画面を確認
