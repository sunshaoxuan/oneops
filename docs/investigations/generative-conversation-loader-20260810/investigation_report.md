# 生成会話ローダー調査報告

## 調査目的

`generativeloaders.com` の公開契約を確認し、OneOps の AI 助手へ適用できる最小の工程インターフェースを定義する。

## 確認結果

公開ドキュメントは `TextLoader`、`InlineLoader`、`ImageLoader` の三つの primitive を提供している。会話応答では、現時点までに受信した全文を `TextLoader` へ渡す契約である。コンポーネントは既存の接頭部を維持し、新しく追加された接尾部をアニメーションする。

OneOps の `AiAssistantChat.tsx` は `agent.message.delta` を受信するたびに `current.text + delta` を保存しているため、この全文更新契約と一致する。応答本文が到着する前は `QUEUED` と `RUNNING` を区別できるため、`InlineLoader` と既存のローカライズ済み状態文言を組み合わせられる。

公開サイトの表示件数と npm 0.1.1 の配布型定義には差がある。実装は npm 配布物の型定義に存在する `cascade` と `signal` だけを利用する。

## 採用範囲

会話テキストと応答待機だけを対象とする。画像生成ローダーは現在の AI 助手会話契約に画像生成状態が存在しないため、接続対象に含めない。

外部コンポーネントは AI 助手から直接利用せず、OneOps の `GenerativeConversationLoader` で会話状態、全文入力、アクセシビリティを統一する。

## 制約

外部パッケージは 0.1.1 の初期版である。バージョンを固定し、利用する variant を型検査と単体試験で拘束する。配信時の実ブラウザ確認を最終受入条件とする。
