# 試験結果

| 検証項目 | 結果 | 証拠 |
| --- | --- | --- |
| Icon Mapping 回帰試験 | 合格 | 1 File、2 Test |
| Portal 全体試験 | 合格 | 25 File、178 Test |
| Gateway 試験 | 合格 | 218 Test |
| Worker 試験 | 合格 | 14 Test |
| Spring Backend 試験 | 合格 | 34 Test、環境依存 8 Test は Skip |
| Production Build | 合格 | TypeScript、Vite |
| 運用 Script | 合格 | 9 Script、Rolling Switch Contract |
| Nginx 設定 | 合格 | `nginx -t` |
| 正式配信 | 合格 | `delivery_succeeded` |
| 公開 Health | 合格 | Local、HTTPS は `UP`、Version 0.16.3 |
| HTTPS 首页 | 合格 | HTTP 200 |
| 静的資材 | 合格 | Dist と WebRoot Index SHA256 一致 |
| Browser | `evidence_missing` | Login 済み Browser Session が利用不可 |
| Console | `evidence_missing` | Login 後 Page を未確認 |
| Screenshot | `evidence_missing` | 3 File を未生成 |
