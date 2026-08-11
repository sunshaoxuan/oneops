# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| 完了済み Markdown は会話幅内に収まる | 正式 Browser、Answer `717 / 717` | 高 | 0.18.16 |
| 会話領域の計算済み `overflow-x` は修正前 `auto` | 正式 Browser Computed Style | 高 | 0.18.16 |
| Grid と Streaming Adapter の縮小境界が不足する | `ai-assistant.css`、`generative-conversation-loader.css` | 高 | Source |
| 0.18.17 は縦 Scroll だけを残す | Source Test、正式 Browser の会話領域 `981 / 981`、`overflow-x: hidden` | 高 | 長文 Streaming 中の Screenshot は未取得 |
| 配信物は検証済み Build と一致する | `index.html`、JS、CSS の SHA-256 一致 | 高 | なし |
| 正式 Runtime は 0.18.17 で稼働する | HTTPS Health `UP`、Legacy Gateway Ready、8092 単独待受 | 高 | なし |
| 長文 Streaming 中も横幅が一致する | Browser Width Measurement | 低 | Windows SSO 遷移後に Browser 制御対象が閉じたため `evidence_missing` |
