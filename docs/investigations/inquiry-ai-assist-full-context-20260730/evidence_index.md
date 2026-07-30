# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| AI 補助 API は問合せ詳細全体を取得する | `app/gateway/inquiry-support-routes.mjs` | 高 | 実サイト応答自体は既存 Parser に依存する |
| 旧 Prompt は対象質問ブロックだけを送信した | 変更前の `app/gateway/inquiry-analysis.mjs` の `sanitizedTicketContext` | 高 | Git 差分で確認する |
| 0.6.3 は CAG チャット経路だけを変更した | `app/gateway/ai-assistant-routes.mjs`、`app/apps/portal-shell/src/ai-assistant-context.ts` | 高 | 問合せ AI 補助とは別経路である |
| 修正後は全質問、全対応記録、顧客評価を送信する | `app/gateway/inquiry-analysis.mjs`、`app/gateway/inquiry-support.test.mjs` | 高 | 実 Model の内容品質は Model 応答にも依存する |
| 連絡先と Secret を除外する | `redactInquiryText` と回帰試験 | 高 | 自由記述の未知形式は継続監視が必要である |
| 実 Model が顧客差評を参照し回答不足を判定した | `docs/evidence/inquiry-ai-assist-full-context-94056-20260730.png`、保存済み AI 補助履歴 | 高 | 問合せ 94056 の Q5 公開返信を対象とした一例である |
