# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Gateway | 合格 | 212 tests、fail 0 |
| Worker | 合格 | 14 tests、fail 0 |
| Portal | 合格 | 19 files、165 tests、fail 0 |
| Portal Build | 合格 | TypeScript Build、Vite Build |
| Spring | 合格 | 33 tests、fail 0、環境条件による skip 7 |
| Diff Check | 合格 | `git diff --check` exit 0 |
| Rolling Delivery | 合格 | `delivery_succeeded`、Nginx 設定検証成功 |
| Runtime | 合格 | Health UP、upstream online、Version 0.15.8 |
| 管理者 Browser | 合格 | Icon 3 件、Tooltip、詳細 Modal、解析表示、再削除 Button 0 件 |
| Console | 合格 | error、warn、warning 0 件 |
| 保存済み返信案の実データ表示 | 対象データなし | 削除済み三件の `draft_reply` は空。共通詳細 Component と Source 試験で経路を確認 |
