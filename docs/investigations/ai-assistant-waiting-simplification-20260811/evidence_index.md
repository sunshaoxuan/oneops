# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 表示を一つの小型 Animation へ簡素化した | `GenerativeConversationLoader.tsx`、CSS | 高 | なし |
| 余分な表示を削除した | Browser DOM の Orbit 0、Meter 0、small 0、Panel なし | 高 | なし |
| Reduced Motion でも変化する | 連続 Frame Opacity 差分 | 高 | Screenshot なし |
| 状態契約を維持した | Unit Test と実 AI Task | 高 | なし |
| 正式配信済み | Health、HTTPS、Asset Hash | 高 | なし |
| Console に問題がない | Error 0、Warning 0 | 高 | なし |
| Screenshot を取得できない | 三条件の `Page.captureScreenshot` Timeout | 高 | `evidence_missing` |
