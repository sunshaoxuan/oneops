# 証拠索引

| 主張 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| 従来表示は小型 Signal だった | `GenerativeConversationLoader.tsx`、Package CSS | 高 | Screenshot は単一 Frame |
| Library は Orbit と Gravity を提供する | `generative-loaders` 0.1.1 型定義及び CSS | 高 | 外部 Package 固定版 |
| 新表示は工程別 Animation を使う | Component Test、Browser | 高 | Browser は配信後追記 |
| 正式 Browser が内部 Animation を Pause する | `prefers-reduced-motion=true`、`animation-play-state=paused` | 高 | Application 内 Browser |
| Reduced Motion でも処理中を示す | Indicator 明暗 Animation、Browser Computed Style | 高 | 配信後再検証 |
