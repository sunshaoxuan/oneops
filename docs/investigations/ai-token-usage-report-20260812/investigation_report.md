# AI Token使用量レポート調査報告

## 結論

既存のAIアシスタントTask Ledgerは回答生成のUsageだけを保持していたため、Provider呼出単位の集計には不足していた。`ai_model_usage_calls` を追加し、AIアシスタントの意図分析、回答生成、個人タスク経由の同処理、問合支援のModel及びAgent Gateway分析を呼出単位で記録する構成とした。

## 動作経路

1. AI呼出開始時に利用者物理ID、機能、Phase、Model及びProviderを保存する。
2. Provider完了時にUsage Feedbackを正規化して保存する。
3. 失敗又は取消時に終端状態とError Codeを保存する。
4. 管理者APIが期間内の記録をユーザー別に集計し、合計Token降順で返す。
5. Portalのレポート画面が期間、概要値及び順位表を表示する。

## 制限

ProviderがUsageを返さない呼出はTokenを0として集計し、Usage取得件数との比率で可視化する。過去のProvider呼出は呼出単位記録が存在しないため遡及集計しない。
