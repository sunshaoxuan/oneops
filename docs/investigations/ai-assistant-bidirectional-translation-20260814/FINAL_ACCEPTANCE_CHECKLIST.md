# 最終受入一覧

| No. | 原要求及び制約 | 成果物 | 検証証拠 | 状態 |
|---|---|---|---|---|
| 1 | 複数回の日本語から中国語への翻訳後も中国語入力を日本語へ翻訳する | Turn 単位目標言語判定 | Routing Test、正式 Browser、Task Ledger | 合格 |
| 2 | 反対方向への再切替も正しく動作する | Semantic Intent v3 と現在入力判定 | Routing Test、正式 Browser、Task Ledger | 合格 |
| 3 | 過去の原文、訳文、方向を現在出力へ混在させない | `responseContextHistory` | OpenAI Runner Test | 合格 |
| 4 | プリセット日中相互翻訳だけへ安全に適用する | `shortcutCode` 実行 Context | Database Test | 合格 |
| 5 | 変更要件を文書化する | AI Assistant 要件、Shortcut 要件、Changelog | 文書差分 | 合格 |
| 6 | 関連試験を完了する | Gateway、Worker、Portal、Spring、Build | `test_results.md` | 合格 |
| 7 | Version 0.18.23 を正式 Runtime へ配信する | Version 一式、SYSTEM 継続配信 | Health、Delivery Log、Nginx | 合格 |
| 8 | UI を Browser、Console、Screenshot で確認する | 正式 OneOps 会話 | `test_results.md`、Crop 済み Screenshot | 合格 |
| 9 | Git master、origin/master、Tag を一致させる | Commit、Push、v0.18.23 | Git 遠端照合 | Git 配信時に確定 |

Git 配信項目は正式 Commit、Push 及び Tag 作成後に最終回执へ記録する。修正が発生した場合は本一覧の先頭から再実行する。
