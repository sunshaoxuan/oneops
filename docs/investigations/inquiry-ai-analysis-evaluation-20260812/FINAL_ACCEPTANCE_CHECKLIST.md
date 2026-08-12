# 最終受入一覧

| No. | 原要求又は制約 | 成果物 | 検証証拠 | 結果 |
|---|---|---|---|---|
| 1 | 問合支援の AI 分析を評価できる | 共通評価 UI、保存 API | 正式 Browser | 合格 |
| 2 | 好評を登録できる | `POSITIVE` 保存 | 保存完了表示、DB、Audit | 合格 |
| 3 | 差評を登録できる | `NEGATIVE` 保存 | 保存完了表示、DB、Audit | 合格 |
| 4 | 差評理由、提案又は評価を補足できる | 2000 文字 TextArea | 正式 Browser、Screenshot | 合格 |
| 5 | 評価と会話資料を DB へ永続化する | 評価表、Run 外部キー、User 外部キー | 実 PostgreSQL 制約と評価行 | 合格 |
| 6 | 将来の教師あり学習評価材料にできる | Run、Model、Input、Output と結合可能な評価契約 | 要求仕様、DB Join | 合格 |
| 7 | 同一利用者が評価を修正できる | Run と Evaluator の Unique、Upsert | 好評から差評への同一 ID 更新 | 合格 |
| 8 | 未完了、失敗、削除済みを対象外にする | API 状態検査、UI 条件 | Gateway Test、正式 Browser | 合格 |
| 9 | 操作を監査する | `INQUIRY_AI_RUN_EVALUATED` | `auth_audit_events` | 合格 |
| 10 | 文書を更新する | 要求仕様、Help、ChangeLog、調査記録 | 文書差分、言語試験 | 合格 |
| 11 | 関連試験を通す | Gateway、Builder、Portal、Spring、Build | `test_results.md` | 合格 |
| 12 | UI を実環境で確認する | 0.18.22 正式配信 | Browser、Console、Screenshot | 合格 |
| 13 | 正式版数と配信状態を一致させる | VERSION、Package、Spring、Portal | Health、Asset Hash | 合格 |
