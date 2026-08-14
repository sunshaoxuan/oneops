# 日中相互翻訳の Turn 方向継続障害調査

## 結論

プリセット `JA_ZH_TRANSLATION` では Task Class と一般的な翻訳制約を Session 内で継続し、翻訳先言語は現在入力から毎 Turn 再判定する。最終生成へ渡す翻訳対象は現在入力だけとし、直前 Turn の原文及び訳文を Context へ含めない。

## 障害事実

正式データベースの Conversation `aa3fa2ae-1bce-409e-acb1-426ccbe87c94` を確認した。障害 Task `7cebc0fd-dede-455c-9571-522292fb3ac8` と再実行 Task `37aa6ce1-66f6-4e2b-ac15-c7f41d39022c` は、いずれも `TRANSLATION`、翻訳先 `Japanese`、継続方式 `INHERITED` まで正しく確定していた。

Intent Analysis は `references_previous_context=true` と `context_scope=latest_turn` を返していた。この結果、直前の日本語原文と中国語訳文が現在の中国語入力と共に最終生成へ渡され、Model が直前の中国語出力方向を継続した。

## 修正

1. Semantic Intent 指示へ、双方向翻訳の翻訳先言語を現在入力から毎 Turn 再判定する契約を追加した。
2. 実行 Context へ Session の Shortcut Code を追加した。
3. `JA_ZH_TRANSLATION` かつ `TRANSLATION` の最終生成履歴を空にし、誤った Intent Analysis が履歴参照を要求した場合も Turn 独立性を維持した。
4. Route Policy Version を `oneops-ai-semantic-intent-v3` へ更新した。
5. 一般要件、Shortcut 要件、変更履歴及び Version 0.18.23 を同期した。

## 設計判断

単方向翻訳は既存の目標言語継続契約を維持する。日中相互翻訳は現在入力だけを翻訳対象とするため、過去の用語や訳文を混在させない。Shortcut Code による保護は既存プリセットの確定済み業務契約へ限定する。
