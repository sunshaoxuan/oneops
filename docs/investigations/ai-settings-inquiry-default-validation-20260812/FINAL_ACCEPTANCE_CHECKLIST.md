# 最終受入一覧

| No. | 原要求又は制約 | 成果物 | 状態 |
|---:|---|---|---|
| 1 | 問合せ既定 Model を有効入力で保存できる | Gateway Validation、正式 Browser | 単体試験合格、Browser 証拠不足 |
| 2 | 接続テストを同じ入力で実行できる | 共通 Validation、正式 Browser | 単体試験合格、Browser 証拠不足 |
| 3 | `INQUIRY` の既定状態を常に `true` とする | Gateway 単体試験 | 合格 |
| 4 | `GENERAL` の既定状態検査を維持する | Gateway 全量試験 | 合格 |
| 5 | API Key、Endpoint、Model 設定を無断変更しない | Code Diff、Database 確認 | Code Diff 合格、Database 証拠不足 |
| 6 | 要件と変更履歴を更新する | 要件文書、CHANGELOG | 合格 |
| 7 | Browser 表示、Console、Screenshot を確認する | 正式 Runtime 証拠 | 認証済み設定画面の証拠不足 |
| 8 | 関連試験を全件合格させる | 全量 Check | 合格 |
| 9 | 正式 master へ精確に Commit、Push する | Git 証拠 | 合格 |
| 10 | 各 Turn の意図分析を GPT で行い、必要時だけ過去 Context を再送する | Runner、Structured Output 試験 | 試験及び Runtime 配信合格、Browser 証拠不足 |
