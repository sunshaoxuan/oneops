# テスト結果

更新日: 2026-08-10

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| Gateway 全試験 | 合格、228 項 | `pnpm --dir app check` |
| Worker 試験 | 合格、14 項 | `pnpm --dir app check` |
| Frontend 全試験 | 合格、187 項 | `pnpm --dir app check` |
| TypeScript と Vite 本番 Build | 合格 | `pnpm --dir app check` |
| PostgreSQL Migration 連続 2 回 | 合格 | category 4、shortcut 12、Session column 2、constraint 1 |
| 候補 Spring Backend | 合格 | `127.0.0.1:8094`、status `UP`、version `0.16.4` |
| 候補 Node Gateway | 合格 | `127.0.0.1:8095`、status `UP` |
| 未認証 API | 合格 | 利用者向け Shortcut API が HTTP 401 を返す |
| AI助手 Browser fixture | 合格 | 動的入口、専門 Session 名、説明、開始例 |
| 第 1 階層カテゴリ | 合格 | 4 件を DOM で確認 |
| 第 2 階層専門対話 | 合格 | 言語カテゴリ 3 件を ArrowRight で展開 |
| AI設定 Browser fixture | 合格 | 4 カテゴリ 12 件、編集 Modal |
| Browser Console | 合格 | 最終 warning 0、error 0 |
| 正式 HTTPS 認証済み Browser | `evidence_missing` | 自署名 HTTPS の Browser 接続が Timeout、Local HTTP は Secure Cookie を確立できない |
| 正式配信 | 未実施 | 既存の本タスク外未コミット変更を正式配信へ混在させないため |

Vite Build は 1100 kB を超える既存 Chunk の警告を 1 件出力する。Build は成功しており、本タスクで新しい Chunk 分割方針は追加していない。
