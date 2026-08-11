# AIアシスタント既存履歴削除 調査報告

更新日: 2026-08-11

## 調査目的

AIアシスタントに残る既存会話の削除 Button を操作しても履歴を削除できない事象について、画面、API、操作監査、所有関係及び Database 削除可能性を確認した。

## 確認した事実

1. 対象旧会話は OneOps PostgreSQL の `ai_assistant_sessions` に `ACTIVE` として存在する。
2. 対象旧会話の `owner_user_id` は現在の利用者物理 ID と一致する。
3. 同じ Conversation ID と所有者物理 ID を条件にした Transaction 内 DELETE は 1 行を返し、Rollback 後に対象行が保持された。
4. 過去 24 時間の操作監査には対象旧会話の READ が存在し、DELETE 要求は存在しなかった。
5. Gateway の DELETE Route は所有者条件付き単一 SQL を呼び、対象行が存在する場合は HTTP 200 を返す。
6. 旧画面は履歴行の小型 Popconfirm で削除を確認していた。対象旧会話の操作は確認完了へ到達せず、DELETE 要求を発生させていなかった。

## 原因

既存会話の所有関係、Database 制約及び DELETE Route は削除可能な状態だった。失敗地点は履歴行の小型削除確認から確定操作へ到達する UI 経路にあり、利用者操作が DELETE 要求へ変換されていなかった。

## 修正

1. 履歴行の削除 Button は対象 Session を削除候補として保持する。
2. 小型 Popconfirm を廃止し、対象会話名を表示する中央 Modal へ変更する。
3. Modal の削除 Button を選択した時だけ DELETE 要求を送信する。
4. 処理中は重複実行、Modal の閉じる Button、Mask による閉じる操作を抑止する。
5. 成功時は Modal を閉じ、対象 Query を除去する。
6. 失敗時は既存の Rollback 経路で削除前の一覧と選択状態を復元し、Modal を維持して再実行できる状態にする。

## 正式実行時受入

1. version 0.18.8 の正式 HTTPS は HTTP 200、Health は `UP`、`legacyGatewayReady=true` だった。
2. 中央 Modal は削除説明、対象会話名、閉じる Button、危険操作の削除 Button を表示した。
3. Modal の削除 Button を選択してから約 410 ミリ秒で対象行と Modal が消え、空状態へ遷移した。
4. 操作監査は `AI_ASSISTANT_SESSION_DELETED`、`DELETE_SESSION`、SUCCESS、HTTP 200、23 ミリ秒を記録した。
5. PostgreSQL の対象 Session 件数は 0 件だった。
6. Browser Refresh 後も削除 Button は 0 件で、空状態を維持した。
7. Browser Console の Warning と Error は 0 件だった。
8. 個人情報を含む全画面 Screenshot を正式証跡にせず、中央 Modal と削除後の AIアシスタント領域だけを裁断して保存した。

## 結論

対象旧会話は削除可能な所有関係と Database 状態を持っていた。小型確認から DELETE 要求へ到達しない UI 経路を中央 Modal へ置換した結果、対象名の確認、確定削除、空状態への遷移、Refresh 後の非復元、監査記録まで一貫して合格した。
