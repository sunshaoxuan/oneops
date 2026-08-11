# 最終受入一覧

| 番号 | 当初要求又は制約 | 成果物 | 証拠 | 状態 |
|---|---|---|---|---|
| 1 | 全ての目盛りを一つの会話 Turn と対応させる | Navigation Item | Button 4件、Turn 4件 | 合格 |
| 2 | Hover で利用者の発言を表示する | User Preview | 全4件 Browser DOM、Screenshot | 合格 |
| 3 | Hover で AI 回答の節選を表示する | AI Preview | 全4件 Browser DOM、Screenshot | 合格 |
| 4 | 両者を明確に区別する | 三言語 Label | Browser、Source Test | 合格 |
| 5 | ChatGPT 型の簡潔な Hover Card と定位を提供する | Preview Card、Click | Scroll Top と Target Top | 合格 |
| 6 | Page Scrollbar を点滅させない | 会話領域内 Layer | Root `1280 / 1280 / 720 / 720` | 合格 |
| 7 | Keyboard Focus からも同じ内容を参照できる | Tooltip Role、ARIA | Focus、`aria-describedby` | 合格 |
| 8 | Test、Build、正式配信を完了する | 0.18.19 | Test、Health、Hash | 合格 |
| 9 | Console と Screenshot を確認する | 正式 Browser 証拠 | Console 0、PNG | 合格 |
| 10 | Git と Release を正式確定する | origin/master、Tag | 実装 Commit `debc7d1`、最終証拠 Commit と `v0.18.19` の一致 | 合格 |

全項目が合格した。最終証拠 Commit の Push と Tag 作成後に Object ID の一致を再確認する。
