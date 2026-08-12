# 問合せ既定 Model 保存 Validation 修正報告

## 目的

AI 設定の問合せ既定 Model で、画面入力が有効であるにもかかわらず保存と接続テストが `MODEL_SETTINGS_VALIDATION_FAILED` となる問題を解消する。

## 原因

問合せ既定 Model は `purpose=INQUIRY` であり、画面は変更不能な既定状態を Form 項目として描画しない。Gateway は `isDefault` を入力値から取得し、Boolean 検査後に `INQUIRY` を `true` へ正規化していた。この順序により、画面 Payload に `isDefault` がない場合は `MODEL_DEFAULT_INVALID` で停止した。

## 修正

Gateway は `purpose=INQUIRY` の `isDefault` を入力 Validation 前に `true` へ正規化する。`GENERAL` は従来どおり画面入力の Boolean を検査する。保存と接続テストは同じ Validation を使用するため、両経路へ適用される。

## セキュリティ境界

API Key の暗号化保存、管理者向け完全値再入力、接続確認及び監査契約は変更しない。Screenshot に表示された API Key は漏えい済みとして Provider 側で失効及び再発行する運用対応が必要である。本修正では秘密値を記録、出力又は変更しない。

## 受入方針

欠落 `isDefault` の単体回帰試験、Gateway と Portal の全量 Check、正式 Runtime 配信、認証済み Browser の接続テストと保存、Console、Screenshot、Database 更新時刻及び Git 配信状態を確認する。

## 追加の AI 文脈継続要求

後続要求として、各 Turn の意味ベースの意図分析と、参照が必要な場合の過去 Context 再送を追加した。GPT Responses API の Structured Outputs で `references_previous_context`、`context_scope`、`intent_summary` を生成し、固定キーワード又は言語列挙を避ける。結果は Task Ledger に保存し、正式回答へは `none`、`latest_turn`、`conversation` の判定結果を反映する。
