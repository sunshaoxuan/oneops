# 問合せ CAG 全体コンテキスト調査報告

## 調査対象

問合せ No. 94056 を例として、問合せ詳細から AI アシスタント、OneOps Gateway、CAG Task Prompt までの参照情報経路を調査した。

## 確認結果

Portal の `buildAiAssistantInquiryContext` は、展開中の `InquiryQuestionThread` だけを入力として質問本文、添付ファイル名、同じ問題ブロックの対応記録を構築していた。初回質問と他の追加質問、他ブロックの内部記録と公開回答、問合せ全体の添付、顧客評価は構造に含まれていなかった。

Gateway の `normalizeInquiryAssistantContext` は、受信した対応記録を `slice(-30)` で最新 30 件へ制限していた。この二段階の縮小により、CAG は画面で選択した Q5 とその近傍だけを受け取り、問合せ全体と否定的な顧客評価を確認できなかった。

## 対応

Portal は現在の `questionKey` を分析対象として保持しながら、問合せの基本情報、全 `questionThreads`、全対応記録、可視性、各添付ファイル名、問合せ全体の添付ファイル名、最終顧客評価を一つの参照情報として構築する。基本情報には顧客組織名と担当者名を含め、顧客担当者名、電話番号、メールアドレスは含めない。

Gateway は対応記録と添付ファイル名の件数制限を廃止し、機密情報の除外だけを継続する。CAG Task Prompt は `questionKey` が今回の分析対象であり、判断には `questionThreads` 全体と `customerEvaluation` を必ず使用するよう明示する。AI アシスタントのメッセージ要求上限は 4 MiB とする。

Portal の顧客評価は全問題ブロックと位置不明 AI 履歴の後へ移動する。「やや悪い」などの否定的評価は浅い赤色背景と赤色タグで表示する。

## 互換性

過去の CAG Task Prompt は新しい全体コンテキスト項目を持たない。新規項目を省略可能として読み取り、過去会話の参照表示を維持する。新しく送信する Task は全項目を含む。

## 変更しない範囲

CAG のコード、プロセス、Conversation ID、SSE、問合せ AI 補助の Model API 経路は変更しない。
