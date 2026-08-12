# 最終受入一覧

| 原要求又は制約 | 成果物 | 検証証拠 | 状態 |
| --- | --- | --- | --- |
| 待機開始時から経過時間を表示する | `GenerativeConversationLoader.tsx` | Focus、Portal Test、正式 Browser | Browser 待ち |
| 30 秒以上で待機継続又は停止後再送信を案内する | `GenerativeConversationLoader.tsx` | 30 秒境界 Test、正式 Browser | Browser 待ち |
| 会話末尾の無回答 Failed Task に再送信操作を表示する | `AiAssistantChat.tsx`、`ai-assistant.css` | `ai-assistant-resubmit.test.ts`、正式 Browser | Browser 待ち |
| 指定位置へ小型文字 Button を配置し現行美術風格を維持する | `ai-assistant-failure-row`、`ai-assistant-resubmit` | Production Build、Screenshot | Screenshot 待ち |
| 保存済み質問、添付及び問合せ参照を新しい Task として送信する | `resubmitFailedTask`、既存 `sendAiAssistantMessage` | Focus Test、実 Task | 実 Task 待ち |
| 過去の失敗、回答本文あり、実行中には表示しない | `canResubmit` | Focus Test、正式 Browser | Browser 待ち |
| 自動再送信と二重送信を行わない | `submitMessage`、既存送信 Lock | Focus Test、実 Task | 実 Task 待ち |
| 日本語、中国語、英語を提供する | `copy` | Focus 3 Files、36 Tests | 合格 |
| UI 変更の全 Test と Build を通す | Portal Test、Production Build | 43 Files、253 Tests、3853 Modules | 合格 |
| 正式配信、Browser、Console、Screenshot を確認する | 正式 Portal | 認証待機画面 Screenshot、Console 0 件 | 不合格、認証後証拠不足 |

全項目が合格するまで正式な完了及び Tag 作成は行わない。
