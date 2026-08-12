# コマンド記録

実施日: 2026-08-12 JST

1. `git fetch --prune origin` と `git status --short --branch` で Repository と並行変更を確認した。
2. `conf/nginx.conf` と80番及び443番 Port の Listener を読み取り専用で確認した。
3. `app/scripts/test-nginx-http-redirect.ps1` で転送設定の構造を検証する。
4. `nginx.exe -t` で構文を検証する。
5. Nginx Reload 後に80番 Port、Location Header、Path、Query String、HTTPS Portal 及び Health を確認する。
6. 直接 Reload は Global Event の権限不足で失敗した。SYSTEM の `Nginx HTTPS Gateway` 計画 Task を停止し、孤立した既存 Worker を実行 Path、Command Line、Parent Process と443番 Listener で特定して終了した後、Task を再起動した。
7. `curl.exe` で Root、Path と Query を含む GET、API Path と Query を含む POST の Status と Location を検証した。
8. `TS2DEVSERVER` と `localhost` の Host Header が同じ HTTPS Host、Path 及び Query String へ転送されることを検証した。
9. Browser で HTTP URL から HTTPS URL への遷移と Console を確認した。Screenshot は通常取得と固定 Viewport 取得が Timeout、Chrome は未接続だった。
10. 専用 Test の日文実行文字列は Windows PowerShell 5.1 が無 BOM UTF-8 を誤解釈し、後続の変数代入を Comment として扱った。この実行を証拠から除外し、Script を ASCII 実行文字列へ統一して Windows PowerShell 5.1 と PowerShell 7 の両方で再実行した。
11. 最初の集約検査は子 PowerShell の終了 Code を確認していなかったため、失敗を見落とした。この集約結果を証拠から除外し、以後は各外部 Process の終了 Code を明示検査した。
