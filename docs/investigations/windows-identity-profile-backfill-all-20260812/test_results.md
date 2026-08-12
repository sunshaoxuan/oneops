# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Identity、EnvPortal、Auth 対象試験 | 45 件成功 | Node Test |
| User Management UI | 6 件成功 | Vitest |
| Portal TypeScript | 成功 | `tsc -b` |
| Migration Transaction | 14 件対象、補完後欠損 0 | Rollback 検証 |
| Gateway 全量 | 304 件成功 | Node Test |
| Portal 全量 | 254 件成功 | Vitest、最新 Remote 統合後 |
| Production Build | 成功 | Vite Build |

Build では既存の Chunk Size Warning だけが出力され、Error はなかった。Production Apply、Runtime 及び Browser は次段階で記録する。

Production Migration は 14 件へ適用され、Domain、Domain Username、UPN 及び表示名の欠損は全て 0 件になった。Migration 再実行は 0 件更新となり幂等性を確認した。正式 Gateway 対象試験 51 件、Spring 41 件中 33 件成功、DB 環境依存 8 件 Skip、nginx 設定試験及び HTTPS Health が成功した。Browser Console Error 及び Warning は 0 件で、認証済み User Management は `evidence_missing` である。
