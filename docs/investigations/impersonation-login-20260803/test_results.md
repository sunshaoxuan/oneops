# テスト結果

更新日: 2026-08-03

| 検証 | 結果 |
| --- | --- |
| Gateway 全体テスト | 成功、147 tests |
| 代理ログイン開始・終了・権限不足・セッション表示 | 成功、専用 4 tests |
| Portal Shell テスト | 成功、120 tests |
| Python テスト | 成功、7 tests |
| 本番ビルド | 成功 |
| データベース移行 | 成功、同一データベースへ 2 回連続適用 |
| Gateway health | 成功、status UP、upstream online |
| Nginx 構成検査 | 成功 |
| HTTPS 到達確認 | 成功、HTTP 200 |
| ブラウザー表示とコンソール | SSO リダイレクト先が Edge によりブロックされ、正式サイトの認証後画面は未確認 |
