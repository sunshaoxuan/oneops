# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| Page Root の寸法は Hover 前後で増加していない | 正式 Browser の `documentElement` 計測 | 高 | 0.18.14 修正前 |
| 会話領域だけが長い Scroll 範囲を持つ | `clientHeight 429`、`scrollHeight 5307` | 高 | 14 Message の対象会話 |
| Preview が Page Root へ追加される | 修正前 `.ant-tooltip` の Parent と画面外初期座標 | 高 | Ant Design 6.5.1 |
| 修正後の Popup は会話 Shell 内へ限定される | `AiAssistantChat.tsx` と正式 Browser | 高 | 正式配信後に再計測 |
| Console に Error と Warning がない | Browser Console | 高 | 正式配信後に再確認 |
