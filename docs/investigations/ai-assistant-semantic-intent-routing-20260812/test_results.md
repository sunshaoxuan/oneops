# 試験結果

| 試験 | 結果 | 証拠 |
|---|---|---|
| Gateway、Portal、Worker 全自動試験 | 合格 | `pnpm test`、Gateway 303、Portal 263、Worker 16 |
| Semantic Routing 追加後の回帰試験 | 合格 | Portal 264、Gateway 関連 30 |
| Portal Production Build | 合格 | Vite Build、既存 Chunk Size Warning あり |
| Browser 表示、Console、Screenshot | 合格 | OneOps v0.18.21、実第三文の簡潔表示、回答 7 秒、Console Error と Warning 0、`docs/evidence/ai-assistant-semantic-intent-translation-0.18.21-final-20260812.png` |
| 正式 Health | 合格 | HTTPS と 8092 は `UP`、Version 0.18.21、Upstream Online、Legacy Gateway Ready |
| Local Task Ledger | 合格 | `status=completed`、Routing と Semantic Intent は `TRANSLATION`、目標言語 `ja`、回答保存済み |
