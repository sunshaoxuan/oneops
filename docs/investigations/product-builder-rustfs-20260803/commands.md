# 実行記録

1. `git fetch origin master`
2. `rg -n -S "minio|MINIO|include_minio|middleware_minio" ...`
3. OneHrStandalone テンプレート内の MinIO 関連ファイルと参照箇所を Python `zipfile` で読み取り確認
4. RustFS 公式 GitHub Releases API から最新三リリースの Windows x86_64 Assets を確認
5. `python -m py_compile builder/standalone_packager.py builder/host_standalone_console.py builder/oneops_worker_test.py`
6. `python -m unittest builder/oneops_worker_test.py`
7. `pnpm test`
8. `pnpm build`
9. RustFS `1.0.0-beta.12` と `1.0.0-beta.11` の公式 Windows x86_64 ZIP を実取得し、正規化済み ZIP と実行ファイルを検証
10. RustFS `1.0.0-beta.11` を使用して正式 `OneHrStandalone.zip` を再構築し、成果物内のミドルウェア、起動スクリプト、NSSM 登録を検証
11. 正式テンプレート内 PowerShell 三ファイルを `System.Management.Automation.Language.Parser` で解析
12. `pnpm run publish`
13. Browser で `https://192.168.20.54/product-builder` を開き、配置、版数、排他操作、コンソール、スクリーンショットを確認
14. `Test-NetConnection` で 443、8092、8091 を確認
15. Gateway health、認証設定、ブラウザーの認証済み画面、配信ログ、Runtime Supervisor を確認
16. `VERSION`、`CHANGELOG.md`、二つの `package.json`、画面版数を OneOps `0.8.5` へ同期し、構築器版数を `0.7.4-oneops` へ更新
17. `pnpm run check` と `pnpm run publish` を再実行
18. 配信完了後の新規 Browser タブで版数、RustFS、排他操作、安定時コンソールを再確認し、最終スクリーンショットを保存
19. GitHub Releases API の 403 レート制限を再現し、空の RustFS 版数一覧との因果関係を確認
20. RustFS 公式 Download Center と公式 CDN の Windows x86_64 固定版 ZIP を確認
21. 版数取得元を公式 Download Center へ変更し、実 URL 30 件、意味版数順、`latest` 除外を確認
