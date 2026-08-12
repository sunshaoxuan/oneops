# 実行コマンド記録

1. `git fetch origin`、`git status`、`git rev-parse HEAD`、`git rev-parse origin/master`
2. 問合支援の Route、Repository、Migration、API Client、Portal 及び Test を `rg` で追跡
3. Gateway 集中試験、Portal 集中試験及び Portal Production Build
4. `pnpm --dir app test` による全 Gateway、Builder、Portal 試験
5. 実 PostgreSQL へ Migration 051 を適用し、制約照会及び Transaction 内 Upsert を実行
6. `pnpm --dir app check`、`publish-portal.ps1`、Spring Test、Nginx 構文検査
7. HTTPS Health、Direct Health、Listener、Upstream 及び配信資産 SHA256 を照合
8. 正式 Browser で AI 履歴検索、好評保存、差評理由保存、再読込回填、Console 及び Screenshot を確認
9. PostgreSQL で評価行及び `auth_audit_events` を照会
