# 最終受入記録

状態: 最終受入継続中

## 当初目的との逐項照合

| 項目 | 合否 | 成果物及び証拠 |
| --- | --- | --- |
| 日本語画面で内部列挙値を表示しない | 検証待ち | 実装と自動試験は合格、正式 Browser 未確認 |
| 日本語表示を承認待ち、有効、停止とする | 検証待ち | 実装と自動試験は合格、正式 Browser 未確認 |
| 一覧と編集選択肢で同じ表示規則を使用する | 合格 | 共通 `userStatuses` 辞書 |
| API と DB の内部列挙値を維持する | 合格 | Select の値は `PENDING`、`ACTIVE`、`SUSPENDED` |
| 簡体字中国語と英語もローカライズする | 合格 | 三言語辞書と Portal 試験 |
| Modal タイトルで編集対象を識別する | 検証待ち | 実装と自動試験は合格、正式 Browser 未確認 |
| Modal 本文先頭で表示名とユーザー名を確認する | 検証待ち | 識別領域を実装、正式 Browser 未確認 |
| メールとドメインアカウントで同名利用者を区別する | 検証待ち | 条件付き表示を実装、正式 Browser 未確認 |
| 狭幅表示で識別情報を欠落させない | 検証待ち | 680px Media Query を実装、正式 Browser 未確認 |
| 自動試験と Production Build | 合格 | Gateway 158、Builder 12、Portal 130、Spring 33、3403 Module |
| 正式成果物を 0.9.2 として配信する | 合格 | Health、HTTPS、新 Asset、SHA-256、配信ログ |
| 正式 Browser、Console、Layout、Screenshot | 検証待ち | Browser 制御接続の復旧が必要 |
| Commit、Tag、Push 後の一致 | 検証待ち | Browser 受入後に実施 |

検証待ち項目が存在するため、完了判定、Release Commit、Tag 及び Push は保留する。Browser 接続復旧後は本一覧の先頭から全項目を再実行する。
