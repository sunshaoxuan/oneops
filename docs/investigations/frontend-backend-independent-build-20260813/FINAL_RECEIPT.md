# 最終受入回执

| 当初目的と制約 | 成果物 | 証拠 | 判定 |
|---|---|---|---|
| 前端だけの構築を受け付ける | 標準発版 validation | unit test | 合格 |
| 後端だけの構築を受け付ける | 標準発版 validation | unit test | 合格 |
| 選択対象だけを交付する | optional artifact collector | 実ファイル test | 合格 |
| 両方空は拒否する | validation | unit test | 合格 |
| 原始 droneci を変更しない | OneOps 適配だけを変更 | droneci status | 合格 |
| 全体試験と build | `pnpm check` | 314、18、270、production build | 合格 |
| Runtime 画面、Console、Screenshot | 正式配信 | 配信後確認 | 実行待ち |
