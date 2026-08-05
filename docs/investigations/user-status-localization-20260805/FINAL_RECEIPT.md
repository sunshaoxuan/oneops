# 最終受入記録

状態: 正式 Browser 受入完了、Git 配信記録更新中

## 当初目的との逐項照合

| 項目 | 合否 | 成果物及び証拠 |
| --- | --- | --- |
| 日本語画面で内部列挙値を表示しない | 合格 | 正式 Browser で確認 |
| 日本語表示を承認待ち、有効、停止とする | 合格 | 正式 Browser で三状態を確認 |
| 一覧と編集選択肢で同じ表示規則を使用する | 合格 | 共通 `userStatuses` 辞書 |
| API と DB の内部列挙値を維持する | 合格 | Select の値は `PENDING`、`ACTIVE`、`SUSPENDED` |
| 簡体字中国語と英語もローカライズする | 合格 | 三言語辞書と Portal 試験 |
| Modal タイトルで編集対象を識別する | 合格 | 正式 Browser Screenshot |
| Modal 本文先頭で表示名とユーザー名を確認する | 合格 | 正式 Browser Screenshot |
| メールとドメインアカウントで同名利用者を区別する | 合格 | 正式 Browser の偽名受入データで確認 |
| 狭幅表示で識別情報を欠落させない | 合格 | Portal Test と正式顧客画面の 705 px 受入 |
| 自動試験と Production Build | 合格 | Gateway 166、Builder 14、Portal 137、Spring 33、3405 Module |
| 正式成果物を 0.9.2 として配信する | 合格 | Health、HTTPS、新 Asset、SHA-256、配信ログ |
| 正式 Browser、Console、Layout、Screenshot | 合格 | Screenshot、Console warning 0、error 0 |
| Commit、Tag、Push 後の一致 | 検証待ち | Browser 受入後に実施 |

正式 Browser 項目はすべて合格した。Commit、Tag、Push 後の一致を最終 Git 配信で確認する。
