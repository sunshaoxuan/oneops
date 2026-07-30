# 問合せ AI 補助の全体コンテキスト調査報告

## 調査対象

問合せ詳細内の質問、返信、次の返信位置から起動する AI 補助について、Portal の操作から Gateway、Model API Prompt までの参照情報経路を調査した。

## 確認結果

AI 補助の作成 API は実サイトから問合せ詳細全体を取得していた。Gateway の `sanitizedTicketContext` は、API で指定された一つの `InquiryQuestionThread` だけを質問と対応記録へ変換していた。他の質問ブロック、他ブロックの内部記録と公開回答、最終顧客評価は Model API Prompt に含まれていなかった。

前回の 0.6.3 変更は全体 AI アシスタントから CAG へ送る `AiAssistantInquiryContext` を対象としており、問合せ内 AI 補助の `buildInquiryAnalysisPrompt` は変更対象に含まれていなかった。

## 対応

Model API Prompt の `workflow.targetQuestionKey` と `workflow.focusedMessageKey` で今回の分析対象を明示する。`questionThreads` へ問合せ全体の全質問、全追加質問、全内部記録、全公開回答、イベント、添付ファイル名を収録し、`customerEvaluation` へ最終評価を収録する。

Prompt は分析対象を中心に評価しながら、全 `questionThreads` と `customerEvaluation` を支持証拠と反証の双方として使用するよう指示する。顧客評価が未回答、回答回避、同一質問の反復、遅延などを示す場合は、その証拠を説明せずに回答十分と結論しない。

## 機密情報

顧客組織名とサポート担当者名は業務コンテキストとして送信する。顧客担当者名、電話番号、メールアドレスは構造に含めず、本文中のメール、電話、パスワード、Cookie、CSRF Token、API Key は既存の除外処理を継続する。

## 変更しない範囲

CAG、全体 AI アシスタント、AI 設定、Agent Gateway 設定、既存 AI 補助履歴は変更しない。新しく作成する AI 補助実行から全体コンテキストを使用する。
