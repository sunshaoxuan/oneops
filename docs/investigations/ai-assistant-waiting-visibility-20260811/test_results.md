# Test 結果

## 自動 Test

| 対象 | 結果 |
| --- | --- |
| 聚焦 Test | 2 File、8 件合格 |
| Gateway | 261 件合格 |
| Worker | 14 件合格 |
| Portal | 33 File、210 件合格 |
| Portal Production Build | 3850 Module、合格 |
| Backend | 40 件中 32 件合格、環境依存 8 件 Skip、失敗 0 件 |
| nginx Configuration | 合格 |

## 配信

| 項目 | 結果 |
| --- | --- |
| Version | 0.18.14 |
| Health | `UP` |
| Backend Online | `true` |
| HTTPS | 200 |
| Upstream | `127.0.0.1:8092` |
| Dist と Web Root SHA256 | `f1483dece41dfe7df72b240c51b29eb116d8025b9d9ea4e7a0cc0f098f79140d`、一致 |

## Browser

| 項目 | 結果 |
| --- | --- |
| Reduced Motion | `true` |
| 待機開始 | `QUEUED`、`0s` |
| Frame 0 Meter Opacity | `[1, 0.24, 1, 1, 1]` |
| Frame 1 Meter Opacity | `[1, 0.24, 0.24, 0.24, 0.24]` |
| 経過秒数 | 0 から 11 へ更新 |
| 次工程 | `STREAMING` を経て完了表示へ遷移 |
| 600px 横 Overflow | `clientWidth=555`、`scrollWidth=555` |
| Console Error | 0 件 |
| Console Warning | 0 件 |
