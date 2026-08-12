# 調査報告

## 結論

Server と DB の会話取得は既に `owner_user_id` を必須条件としていた。Client の会話詳細 Cache が会話 ID だけを Key とし、利用者切替時に Component 内 State を再生成しない点が利用者隔離の不足である。問合せ参照はチケット No. と `questionKey` の組合せで重複排除していたため、同一票の複数質問が別参照として表示された。問合せ票から最近会話を復元する契約は存在しなかった。

## 実装契約

`ai_assistant_sessions.inquiry_ticket_no` を会話の票関連として追加する。会話一覧は所有者条件と更新日時降順を維持し、Client は同一利用者の一覧から同一票の先頭会話を選択する。Client Cache、Local Storage 及び Component Lifecycle は利用者 ID を境界とする。Task 作成時は会話の票番号と入力 Context の票番号が一致することを Server で検証する。
