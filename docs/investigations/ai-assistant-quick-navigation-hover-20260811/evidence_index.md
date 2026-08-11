# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| Page Root の寸法は Hover 前後で増加していない | 正式 Browser の `documentElement` 計測 | 高 | 0.18.14 修正前 |
| 会話領域だけが長い Scroll 範囲を持つ | `clientHeight 429`、`scrollHeight 5307` | 高 | 14 Message の対象会話 |
| Preview が Page Root へ追加される | 修正前 `.ant-tooltip` の Parent と画面外初期座標 | 高 | Ant Design 6.5.1 |
| 会話 Shell 方式は異常な負座標を残す | 正式 Browser の Popup 計測と Screenshot 失敗 | 高 | 不採用方式 |
| 最終 Popup は固定 Viewport Layer へ分離される | `AiAssistantChat.tsx` と正式 Browser | 高 | 正式配信後に再計測 |
| Console に Error と Warning がない | 正式 Browser Console | 高 | Error 0、Warning 0 |
| Hover と離脱で Scrollbar 表示が変化しない | `quick-navigation-hover-0.18.15.png` と `quick-navigation-away-0.18.15.png` | 高 | 1280 x 720 Viewport |
| 配信 Asset は Build と一致する | `index.html` SHA256 `A00C0315BE1BC84720505273D4304DACC7A883430371E5B99FF4B457112A06AE` | 高 | 0.18.15 |
