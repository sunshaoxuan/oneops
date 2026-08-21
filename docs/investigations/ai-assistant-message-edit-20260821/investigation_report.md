# AIアシスタント送信済みメッセージ編集の調査記録

## 対象

AIアシスタントの過去ユーザーメッセージへ、コピーとインライン編集を追加する。編集確認では、元の会話位置、問合せ参照、添付、Session 開始 Model、Shortcut 継続指示を維持する。

## 調査結果

既存の `replacesTaskId` は、元 Task を `REPLACED`、その後の可視 Task を `TRUNCATED` とし、同じ `message_position` へ新しい Task を挿入する。前端には過去ユーザーメッセージの操作がなく、置換 Route はクライアント指定の問合せ参照と添付 ID を受け入れていた。添付 Store は一度 Task に結合した添付の再利用を拒否していた。Model History は置換済み、切断済み Task を除外していなかった。

## 実装方針

1. ユーザーメッセージの Hover と Focus でコピー、編集 Icon を表示する。
2. コピーは改行を保持する `text/plain` と、エスケープ済みの `text/html` を Clipboard へ渡す。
3. 編集確認は既存の置換フローを使用し、新しい本文だけを送信する。
4. Route は元 Task を所有者境界で取得し、保存済みの問合せ参照と添付だけを採用する。
5. 添付 Store は元 Task に結合済みの添付だけを再利用し、新しい置換 Task へ再結合する。
6. Model History は `VISIBLE` の終端 Task だけを使用する。

## 受入対象

Browser では、Hover の二 Icon、Clipboard の改行、編集取消、編集確認、置換位置、Task Ledger、Console と Screenshot を確認する。
