# 試験結果

| 対象 | 結果 | 詳細 |
|---|---|---|
| Portal Test | 合格 | 33 Files、210 Tests |
| Portal Production Build | 合格 | 3850 Modules |
| Gateway Test | 合格 | 261 Tests |
| Worker Test | 合格 | 14 Tests |
| Backend Test | 合格 | 40 Tests、8 Skipped |
| 運用 Script Test | 合格 | 9 Scripts |
| `pnpm check` Wrapper | 環境制約 | 独立副本に固定相対 Path `..\\runtime\\python` がなく終了。各構成 Test は正式 Runtime Path で個別合格 |
| 初回正式 Browser | 不合格 | 会話 Shell 方式で異常な負座標を検出し返工 |
| 返工後 Portal Test | 合格 | 33 Files、210 Tests |
| 返工後 Production Build | 合格 | 3850 Modules |
| 正式配信 | 合格 | `delivery_succeeded`、0.18.15 |
| Hover Root 寸法 | 合格 | 前、中、後が全て 1280 x 720 |
| Tooltip Layer | 合格 | `position: fixed` |
| Console | 合格 | Error 0、Warning 0 |
| Screenshot | 合格 | Hover と Pointer 離脱の 2 Frame |
| Asset Hash | 合格 | Build と配信 `index.html` SHA256 `A00C0315BE1BC84720505273D4304DACC7A883430371E5B99FF4B457112A06AE` |
