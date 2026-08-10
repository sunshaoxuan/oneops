# 試験結果

| 試験 | 結果 | 証拠 |
|---|---|---|
| 専用スクロール境界回帰試験 | 合格 | 1 file、2 tests |
| 短い会話の Browser 寸法 | 合格 | 文書高 1245、Layout 高 1245 |
| 長い会話の Browser 寸法 | 合格 | 文書高 1245、会話 scrollHeight 2482 |
| Browser Console | 合格 | warning 0、error 0 |
| 通常作業区 Gateway 全試験 | 合格 | 218 tests |
| 通常作業区 Builder 全試験 | 合格 | 14 tests |
| 通常作業区 Portal 全試験 | 合格 | 24 files、176 tests、並行作業中の未コミット試験修正を含む |
| 隔離 commit 専用試験 | 合格 | 1 file、2 tests |
| 隔離 commit Production build | 合格 | Vite production build |
| 隔離 commit 全量試験 | 不合格 | 本変更外の既存 Portal 旧断言 7 件、並行変更は取り込まない |
| Spring Backend | 合格 | 34 tests、8 environment skips |
| 運用 script | 合格 | 9 parsed scripts |
| 正式 HTTPS | evidence_missing | 隔離全量試験が未合格のため未公開 |
