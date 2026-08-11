# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 現行表示は静止に見える | 利用者提供 Screenshot | 高 | 静止画像 |
| 正式 Browser は Reduced Motion を要求する | Browser `matchMedia` | 高 | Application 内 Browser |
| Library 内部 Animation は一度で停止する | `generative-loaders/dist/styles.css` | 高 | 0.1.1 配布物 |
| 外側 Pulse の変化範囲が小さい | `generative-conversation-loader.css` と利用者指摘 | 高 | 0.18.13 |
| 修正版の連続活動 | `waiting-frame-0-0.18.14.png` と `waiting-frame-1-0.18.14.png` | 高 | 正式 HTTPS 実 Task |
| 五分割 Meter が連続変化する | Frame 0 `[1, 0.24, 1, 1, 1]`、Frame 1 `[1, 0.24, 0.24, 0.24, 0.24]` | 高 | Computed Opacity |
| 実経過時間が更新される | `data-elapsed-seconds` が 0 から 11 へ更新 | 高 | 正式 HTTPS 実 Task |
| 状態遷移を維持する | `QUEUED`、`STREAMING`、完了表示へ遷移 | 高 | SSE 実 Task |
| Console に問題がない | Error 0、Warning 0 | 高 | 正式 Browser Dev Log |
