# 試験結果

## 実装中の定向試験

| 試験 | 結果 | 証拠 |
| --- | --- | --- |
| Agent Gateway Timeout、切替、Circuit、SSE | 合格 | 12 件成功 |
| AI Session Route、Compact Task、並行 Task、SSE、削除 | 合格 | 13 件成功 |
| Portal AIアシスタント | 合格 | 21 件成功 |
| 現行日本語文書の名称統一 | 合格 | 5 件成功の Project Language Test に含む |
| Portal Production Build | 合格 | TypeScript 及び Vite Build |
| 変更後 Route Read Probe | 合格 | 72.8 ms、8,878 Byte、CAG 1 Request |

## 全量自動試験

| 試験 | 結果 |
| --- | --- |
| Gateway | 255 passed |
| Builder | 14 passed |
| Portal | 197 passed |
| OneOps 合計 | 466 passed |
| Spring | 40 tests、32 passed、8 environment skipped |
| Portal Production Build | 合格 |

Operation Test、配信後 Runtime、Browser、Console、Network 及び Screenshot は最終受入時に追記する。
