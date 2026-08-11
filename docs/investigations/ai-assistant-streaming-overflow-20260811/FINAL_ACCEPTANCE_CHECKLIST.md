# 最終受入一覧

| 番号 | 当初要求又は制約 | 成果物 | 証拠 | 状態 |
|---|---|---|---|---|
| 1 | 回答生成中の超幅と Page 変形を解消する | Streaming 幅境界 | Unit Test、正式 Browser Width | 未合格、Streaming Screenshot 欠落 |
| 2 | 横 Scrollbar を表示しない | 縦 Scroll 専用会話領域 | `overflow-x: hidden`、会話領域 `981 / 981` | 一部合格、Streaming Screenshot 欠落 |
| 3 | 長文を欠落させず折り返す | Loader Copy と Message の折返し | Unit Test、Browser Screenshot | 未合格、Screenshot 欠落 |
| 4 | 完了後 Markdown と縦 Scroll を維持する | 既存 AiMarkdown と会話 Scroll | 0.18.16 Browser、0.18.17 Unit Test | 一部合格、0.18.17 完了後 Screenshot 欠落 |
| 5 | AIアシスタントだけを変更する | CSS、Test、要件文書 | Git Diff | 合格 |
| 6 | 関連 Test と Build を実行する | Test 一式 | `test_results.md` | 合格 |
| 7 | 正式配信、Console、Screenshot を確認する | 0.18.17 Runtime | Health、Hash、Browser | 配信合格、Console と Screenshot は未合格 |
| 8 | Git を正式確定する | `origin/master` と Tag | Git Object ID | HEAD と origin/master は一致、Tag は門禁により未作成 |

未合格項目があるため、完了又は正式引渡しを宣言しない。Windows SSO を通過できる Browser Session で項目1から全項目を再実行する。
