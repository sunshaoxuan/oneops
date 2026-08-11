# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| 第二階層 DOM は生成されていた | 正式 Browser DOM Snapshot、3件の助手と Model 情報 | 高 | 修正前は Viewport 外 |
| 修正前座標が異常だった | Popup Rect `x=-5800, y=-6980` | 高 | なし |
| 最終 Container は常時存在する | `shortcutContainerRef`、分割 Button Row、標準 Submenu Popup Class、正式 DOM の直接 Parent | 高 | なし |
| 第二階層を第一階層から分離する | Computed `position: absolute`、幅312px、第一階層198x168px維持 | 高 | なし |
| 広幅で右方向へ表示する | 1280x720、第一階層 `x=182..380`、第二階層 `x=388..700` | 高 | なし |
| 中間狭幅で左方向へ表示する | 652x698、第一階層 `x=425..623`、第二階層 `x=105..417` | 高 | なし |
| 携帯幅を Viewport 内へ保持する | 375x667、第二階層 `x=34..346` | 高 | なし |
| 浮動 Window の裁切を防ぐ | Window `x=801..1241`、第二階層 `x=914..1226` | 高 | なし |
| 12件の助手と Model 情報を表示する | 正式 DOM、全4 Category、名称、説明、Model、推理強度、速度 | 高 | なし |
| Keyboard で開閉できる | Enter、Space、ArrowDown、Escape の正式 Browser 実行 | 高 | なし |
| Console に異常がない | 正式 Browser Warning 0件、Error 0件 | 高 | なし |
| 正式 Screenshot | `docs/evidence/ai-assistant-shortcut-submenu-20260811.png`、`-375.png`、`-floating.png` | 高 | なし |
| 正式配信が稼働している | `delivery_succeeded`、Health 0.18.13、Asset Hash 一致、`nginx -t` | 高 | なし |
