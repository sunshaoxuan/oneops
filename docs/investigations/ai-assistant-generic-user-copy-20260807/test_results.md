# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Gateway | 合格 | 212 tests、fail 0 |
| Worker | 合格 | 14 tests、fail 0 |
| Portal | 合格 | 19 files、166 tests、fail 0 |
| Portal Build | 合格 | TypeScript、Vite |
| Spring | 合格 | 33 tests、fail 0、環境条件による skip 7 |
| 運用 Script | 合格 | 9 scripts、Rolling Switch、Recovery、Supervisor |
| Browser | 合格 | AI 表現、内部方式名 0 件 |
| Console | 合格 | error、warn、warning 0 件 |
| Rolling Delivery | 合格 | `delivery_succeeded` |

## 配信後の再確認

2026-08-07 の配信後に `D:\nginx\runtime\node\pnpm.cmd check` を再実行した。Gateway は 212 項目中 211 項目に合格し、唯一の不合格は並行作業で追加された未追跡ディレクトリ `app/packages/animated-loading-buttons/src/upstream` 内の英語上流コメント 84 件を、Project 言語検査が検出したためである。本変更の Source、Test 及び正式配信物に起因する新規不合格は検出されていない。

正式 Runtime は再確認時点で `status=UP`、`upstream.online=true`、`upstream.version=0.15.9`、HTTPS 200、Portal Asset `assets/index-B_i22DkJ.js` であった。
