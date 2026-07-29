# AI アシスタント Conversation 連携回执

## 状態

OneOps 0.3.0 のコード、Migration、API、全体チャット画面、権限、監査を実装した。

## 実装境界

CAG の `conversation.id` を OneOps の Session ID として直接使用する。OneOps はユーザーと Conversation の所有関係を保存し、CAG は Task、Prompt、AI メッセージ、Conversation sequence の正式データソースを維持する。

CAG のコードとプロセスは変更していない。

## 追加した操作

履歴ごとの削除、最初の発言によるタイトル生成、問合せ詳細で展開中の質問表示、問合せコンテキストの CAG Task 送信を追加した。削除は OneOps の所有関係だけを対象とし、削除 API のない CAG Conversation は変更しない。

## 残確認

再公開後の認証済み画面で、履歴ごとの削除、タイトル、問合せコンテキスト表示、Conversation ID 一致、SSE 逐次表示、履歴復元、コンソール、画面幅、スクリーンショットを確認する。
