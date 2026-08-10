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
| Gateway | 261 passed |
| Builder | 14 passed |
| Portal | 203 passed |
| OneOps 合計 | 478 passed |
| Spring | 40 tests、32 passed、8 environment skipped |
| Portal Production Build | 合格 |
| Project Language と Version | 5 passed |
| 調査文書日本語検査 | 6文書、簡体字 Marker 0件、合格 |

## CAG 全量自動試験

| 試験 | 結果 |
| --- | --- |
| Backend | 186 passed、4 skipped、Coverage 85.11% |
| Frontend | 22 passed |
| Frontend Production Build | 合格 |
| PowerShell Supervisor | 11 passed |
| Docker Compose | 合格 |

## 実行時受入

| 確認項目 | 結果 |
| --- | --- |
| OneOps Health | `UP / 0.18.7`、`legacyGatewayReady=true` |
| 配信 Asset | `/assets/index-CHWKXK31.js` |
| 配信と Build | `index.html` SHA-256 完全一致 |
| AI画面60秒以上 | Dashboard GET 0、Dashboard SSE 0、個人タスク概要 0、認証 Session 継続 |
| Session 再読込 | API 16 ms、Browser Control 上限 2,639 ms |
| Session 削除 | 履歴行 64 ms、Server DELETE 9 ms、Refresh 後も削除維持 |
| 組織機関往復 | `PUBLIC 共通` を AI、System Management、Workbench 往復後も保持 |
| OneOps Console | Application Warning 0、Error 0 |
| CAG Runtime | 8000、8001、8002 `ready / 0.28.3` |
| CAG Ingestion SSE | 接続中 `idle in transaction=0`、離脱後 Established 0本 |
| CAG Scheduler | 20秒で Source 更新差分0件、CAG API CPU 増分0.062秒、PostgreSQL CPU 1.53% |
| CAG 依存自動復旧 | PostgreSQL と Redis の隔離 Crash Test で各 `RestartCount=1`、再 Ready。現行 Container は無停止 |
| CAG Console | Application Warning 0、Error 0 |
| Screenshot | OneOps と CAG の安全なトリミング済み画像を保存。OneOps SHA-256 は `515431212B480E0C5238E4095AAEF5C3E338C7DDE012F2598982FB5AED38A87F` |
