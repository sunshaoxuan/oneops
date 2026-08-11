# AI 応答待機 Animation 調査報告

## 目的

AIアシスタントの「AI の応答待ち」が静止表示に見える原因を確認し、既存 Animation Library を使用して処理中であることを明確に表示する。

## 原因

待機状態は `generative-loaders` の `signal` を使用していた。既定 Size は `1.15em`、色は周辺 Text と同じ低 Contrast 色であり、三本の細い Bar の変化幅も小さいため、処理中であることが視覚的に伝わりにくかった。正式 Browser は `prefers-reduced-motion: true` を返し、Library が内部 Animation を Pause していたため、実際に完全な静止表示となっていた。

## 修正

- `QUEUED` は Brand 色の `orbit` を `1.35em`、速度 `1.1` で表示する。
- `RUNNING` と本文到着前の `STREAMING` は `gravity` を表示する。
- Reduced Motion では回転及び位置移動を停止し、外側 Indicator の低速な明暗変化だけを表示する。

## 制限

Browser、Console、Screenshot は正式配信後に確認する。
