# 試験結果

| 試験 | 結果 | 証拠 |
|---|---|---|
| Gateway 集中試験 | 合格 | 44 件成功 |
| Gateway 全体試験 | 合格 | 212 件成功 |
| Builder 試験 | 合格 | 14 件成功 |
| Portal 試験 | 合格 | 19 File、165 件成功 |
| Spring Backend 試験 | 合格 | 33 件、失敗 0、環境依存 7 件 Skip |
| TypeScript と本番 Build | 合格 | `tsc -b`、Vite Build 成功 |
| 差分空白検査 | 合格 | `git diff --check` エラー 0 件 |
| 実 PostgreSQL | 合格 | 列、権限、SYSTEM_ADMIN 割当、論理削除、内容保持を確認 |
| 公開 Runtime | 合格 | Nginx、8092 Health、Version 0.15.7 |
| Browser と Console | 合格 | 生成者、本人削除、管理者表示、error 0、warning 0 |
| Screenshot | 合格 | 顧客情報を含まない AI 履歴領域の裁切証跡 |
| 一時データ削除 | 合格 | 受入専用履歴の残留 0 件 |
