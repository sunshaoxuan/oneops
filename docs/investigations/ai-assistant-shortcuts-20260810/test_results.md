# テスト結果

更新日: 2026-08-10

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| Workspace 一括確認 | 合格 | `pnpm check` |
| Gateway 全試験 | 合格、255 項 | `pnpm check` |
| Worker 試験 | 合格、14 項 | `pnpm --dir app check` |
| Frontend 全試験 | 合格、30 File、197 項 | `pnpm check` |
| TypeScript と Vite 本番 Build | 合格 | `pnpm --dir app check` |
| Spring Backend | 合格、40 項中 32 項合格、8 項 Skip | Maven `test`、BUILD SUCCESS |
| クイックアシスタントと Layout 定向試験 | 合格、34 項 | Vitest |
| 静止時の正式 Browser | 合格 | 2 個の入口とも全周 `rgb(255, 176, 135)`、Animation `none` |
| Hover 時の正式 Browser | 合格 | 分割軌道と Icon Animation が `running` |
| ポインター離脱後の正式 Browser | 合格 | 完全な円形輪郭、Animation `none` へ復帰 |
| 正式 Browser Screenshot | 合格 | `browser-static-complete-ring-0.18.5.jpg`、`browser-hover-orbit-0.18.5.jpg` |
| 正式 Browser Console | 合格 | OneOps 由来 0 件。Immersive Translate 拡張機能由来 Error 1 件 |
| 正式配信 | 合格 | HTTPS 200、Health `UP`、version 0.18.5 |
| PostgreSQL Migration 連続 2 回 | 合格 | category 4、shortcut 12、Session column 2、constraint 1 |
| 候補 Spring Backend | 合格 | `127.0.0.1:8094`、status `UP`、version `0.16.4` |
| 候補 Node Gateway | 合格 | `127.0.0.1:8095`、status `UP` |
| 未認証 API | 合格 | 利用者向け Shortcut API が HTTP 401 を返す |
| AI助手 Browser fixture | 合格 | 動的入口、専門 Session 名、説明、開始例 |
| 第 1 階層カテゴリ | 合格 | 4 件を DOM で確認 |
| 第 2 階層専門対話 | 合格 | 言語カテゴリ 3 件を ArrowRight で展開 |
| AI設定 Browser fixture | 合格 | 4 カテゴリ 12 件、編集 Modal |
| Browser Console | 合格 | 最終 warning 0、error 0 |
| Git Push | 合格 | 機能 Commit `4bab6cf`、`HEAD` と `origin/master` 一致 |

Vite Build は 1100 kB を超える既存 Chunk の警告を 1 件出力する。正式 Browser Console の Error 1 件は `chrome-extension://amkbmndfnliijdhojkpoglbnaaahippg/` から発生し、OneOps Asset 又は API の Error ではない。
