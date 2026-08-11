# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| 目盛りと会話 Turn は一対一である | 正式 Browser の Button 4件、Turn 4件 | 高 | 検証 Session の件数 |
| 旧 Tooltip は内容を持つが画面外に残る | 正式 Browser DOM、`x = -12800`、`y = -7200` | 高 | 0.18.18 |
| Preview は利用者発言と AI 回答を区別する | Source、Portal Test、正式 Browser 全4件 | 高 | なし |
| Preview 表示で Page Root を拡張しない | Root `1280 / 1280 / 720 / 720`、Screenshot | 高 | 1280 x 720 Viewport |
| Click で対応発言へ移動する | Scroll Top `306 -> 18`、Target Top `181` | 高 | なし |
| Keyboard Focus で Preview を維持する | Focus、`aria-describedby`、Preview DOM | 高 | なし |
| 正式画面に検証済み Asset が配信された | Build と配信先の SHA-256 一致 | 高 | なし |
