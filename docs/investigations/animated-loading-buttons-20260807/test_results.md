# 試験結果

## 自動試験

| 試験 | 結果 | 詳細 |
|---|---|---|
| variant 契約 | 合格 | 25 件、unique ID 25、WebGL 13、SVG 6、Canvas 4、DOM 2 |
| 上流 snapshot hash | 合格 | 30 files、SHA-256 mismatch 0 |
| Portal Vitest | 合格 | 20 files、168 tests |
| Gateway 及び project language | 合格 | 213 tests。第三者 `third-party` snapshot の専用境界試験を含む |
| Builder Python | 合格 | 14 tests |
| Spring Backend | 合格 | 34 tests、skip 8、BUILD SUCCESS |
| TypeScript と production build | 合格 | 25 variant が個別 chunk、图库が独立 chunk |
| Operations scripts | 合格 | 9 scripts、全検査 true |
| `git diff --check` | 合格 | whitespace error 0 |

## 実ブラウザー試験

| 項目 | 結果 | 証拠 |
|---|---|---|
| 25 種類の表示 | 合格 | cards 25、variants 25、unique 25、mount error 0 |
| 非同期操作状態 | 合格 | `aria-busy=true` かつ disabled 25 |
| 動画進行 | 合格 | 第一 preview の screenshot hash が 300ms 後に変化 |
| Desktop responsive | 合格 | 1265px で document width と viewport width が一致 |
| Mobile responsive | 合格 | 実効 375px で document width が一致、1 column 343px |
| Console | 合格 | error 0、warning 0 |
| Screenshot | 合格 | top、bottom、mobile の三枚 |

## 正式リリース試験

| 項目 | 結果 | 証拠 |
|---|---|---|
| WebRoot 配信 | 合格 | published index と dist index の SHA-256 が `bdd4aad254491a781fc6b57f5be60dd342625ffe6b8965c585630828a1a879b1` で一致 |
| HTTPS | 合格 | `https://192.168.20.54/ui/loader-buttons` が 200 |
| Backend health | 合格 | status `UP`、version `0.16.0` |
| 正式 Browser DOM | 合格 | cards 25、variants 25、unique 25、busy disabled 25、loader error 0 |
| 正式 animation | 合格 | 300ms 間隔の第一 preview SHA-256 が相違 |
| 正式 responsive | 合格 | viewport 1265、document width 1265 |
| 正式 Console | 合格 | error 0、warning 0 |
| 正式 screenshot | 合格 | `loader-buttons-gallery-production-20260807.png` |

## 既知の観察

全頁 screenshot は動的 Canvas の取得中に同一領域が重複して結合された。ページ DOM の重複及び横溢れは検出されなかったため、検証証拠を通常 viewport の top、bottom、mobile 三枚へ分割した。
