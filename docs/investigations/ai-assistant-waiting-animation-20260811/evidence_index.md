# 証拠索引

| 主張 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| 従来表示は小型 Signal だった | `GenerativeConversationLoader.tsx`、Package CSS | 高 | Screenshot は単一 Frame |
| Library は Orbit と Gravity を提供する | `generative-loaders` 0.1.1 型定義及び CSS | 高 | 外部 Package 固定版 |
| 新表示は工程別 Animation を使う | Component Test、正式 Browser Screenshot | 高 | Screenshot は単一 Frame |
| 正式 Browser が内部 Animation を Pause する | `prefers-reduced-motion=true`、`animation-play-state=paused` | 高 | Application 内 Browser |
| Reduced Motion でも処理中を示す | `animation-play-state=running`、Opacity と Filter の時点差 | 高 | Application 内 Browser |
| Console Error がない | Browser Console Error 0、Warning 0 | 高 | 受入時点 |
