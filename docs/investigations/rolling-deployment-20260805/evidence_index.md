# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 変更前は主系停止区間がある | 変更前 `publish-portal.ps1` | 高 | Source 契約 |
| 予備系から主系へ流量を切り替える | `publish-portal.ps1`、Nginx Include、正式配信ログ | 高 | なし |
| 主系失敗時に予備系を維持する | `delivery_degraded_candidate_kept` 分岐 | 高 | 障害注入は未実施 |
| Portal Index を原子的に交換する | `index.html.next` の Move | 高 | 運用 Script 試験対象 |
| 公開 HTTPS の連続利用 | 174 件及び 1301 件の連続 Health が全件 HTTP 200 | 高 | 100 ms 間隔 |
| Windows JAR Lock を回避する | Maven `rolling` Profile と 39,319,049 bytes の分類 JAR | 高 | 正式主系 JAR 交換時だけ主系を停止 |
| 配信後の主系収口 | `8092` と `8093` だけが Listen、Nginx Include は `8092` | 高 | なし |
