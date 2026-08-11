# 試験結果

更新日: 2026-08-11

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| Gateway | 合格、261件 | Node Test、Failure 0 |
| Worker | 合格、14件 | Python unittest、Failure 0 |
| Portal | 合格、33 File、209件 | Vitest、Failure 0 |
| TypeScript と Production Build | 合格 | Vite、CSS `index-BVEKlJma.css`、JS `index-DeHLaldn.js` |
| Spring Backend | 合格、40件 | Failure 0、Error 0、環境条件 Skip 8件 |
| 広幅 Browser | 合格 | 1280x720、右方向、Popup `x=388..700` |
| 中間狭幅 Browser | 合格 | 652x698、左方向、Popup `x=105..417` |
| 携帯幅 Browser | 合格 | 375x667、重ね表示、Popup `x=34..346` |
| 浮動 Window Browser | 合格 | Window `x=801..1241`、Popup `x=914..1226` |
| 第二階層内容 | 合格 | 全4 Category、全12件、Model、推理強度、速度 |
| Parent と Layout | 合格 | Row直下、Absolute、第一階層198x168px維持、Y=231px一致 |
| Keyboard | 合格 | Enter、Space、ArrowDownで開く、Escapeで両階層0件 |
| Console | 合格 | Warning 0件、Error 0件 |
| Screenshot | 合格 | 1280px、375px、浮動 Window の3件を目視確認 |
| SYSTEM Continuous Delivery | 合格 | 2026-08-11 13:34:28 `delivery_succeeded` |
| Health | 合格 | HTTP 200、UP、0.18.13、Legacy Gateway Ready |
| Asset 一致 | 合格 | 正式及び Build `index.html` SHA256一致 |

## 返工記録

最初の最終受入で375pxの `x=-172` と浮動 Window の `x=1234..1546` を検出した。Row右端へ重ねる修正後、全試験と最終受入を先頭から再実行した。

Build は Chunk Size、Spring Test は Mockito Agent に関する将来互換警告を出力した。今回の試験結果と Browser Console に失敗はない。
