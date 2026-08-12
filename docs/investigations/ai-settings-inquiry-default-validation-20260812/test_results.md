# 試験結果

| 試験 | 結果 | 証拠 |
|---|---|---|
| Gateway Model 設定対象試験 | 合格 | 9 件合格 |
| Portal 対象試験 | 合格 | 33 File、220 件合格 |
| 対象 Diff Check | 合格 | Error 0 件 |
| 全量 Check | 合格 | Gateway 302 件、Builder 16 件、Portal 263 件、Backend 44 件合格 |
| 正式 Runtime | 合格 | `publish-portal.ps1` の `delivery_succeeded`、8092 と 8093 は `UP`、Version `0.18.20` |
| Browser 保存、Console、Screenshot | 証拠不足 | 認証済み AI 設定画面へ到達できず未実行 |
| 意図分析 Structured Output 検証 | 合格 | Gateway 10 件合格に含む |
