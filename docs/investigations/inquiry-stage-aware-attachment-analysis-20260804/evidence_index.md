# 証跡索引

| 主張 | 証跡 | 確度 | 制約 |
| --- | --- | --- | --- |
| 未回答案件には公開回答と顧客評価がない | 実サイト詳細の型、件数、状態だけを出力した確認 | 高 | 本文は保存しない |
| 従来 Prompt は添付名と形式だけを送る | `app/gateway/inquiry-analysis.mjs` の修正前経路 | 高 | 画像本文なし |
| 現行 Model API は画像入力を受理する | 無情報 PNG による HTTP 200 の能力確認 | 高 | 特定の設定済みモデルで確認 |
| 実 PPTX は画像 1 件を含む | 新しい添付解析器の実ファイル構造確認 | 高 | 画像自体は保存しない |
| 段階契約が早期品質評価を禁止する | `inquiry-support.test.mjs` | 高 | Model 出力本文は保存しない |
| Portal は空の顧客評価を非表示にする | `inquiry-support.test.ts` と正式画面 | 高 | 正式画面確認は公開後に実施 |
| CAG Task API に構造化添付欄がない | `D:\workspace\cag\backend\app\api\tasks.py` | 高 | CAG は参照のみ |

関連証跡は `investigation_report.md`、`commands.md`、`test_results.md`、`cag_attachment_resource_requirement.md`、`FINAL_RECEIPT.md` に分割する。
