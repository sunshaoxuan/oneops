# 最終確認票

## status

実装、公開、検証完了

## implemented

1. Task 実行状態によるチャット全体の利用不可判定を削除した。
2. HTTP 要求中も入力欄を編集可能にした。
3. 同一送信操作の重複だけを抑止した。
4. 上流拒否時の入力復元を追加した。
5. 同一公開サービス、同一 Agent Gateway Endpoint の要件を文書化した。

## unchanged

1. CAG コード
2. CAG 8000 プロセス
3. OneOps 公開ポート

## validation

1. `pnpm check`: Gateway 127 件、Worker 4 件、Portal 93 件が成功
2. `pnpm test:operations`: 成功
3. Production build と Portal 公開: 成功
4. `nginx -t`: 成功
5. Gateway health: `UP`
6. 認証後ブラウザー表示と入力操作: 成功
7. ブラウザーコンソール error、warning: 0 件
8. スクリーンショット: 取得済み

## upstream_boundary

稼働中 CAG 0.12.0 は、同一 Conversation に非終端 Task がある場合に HTTP 409 を返す。OneOps は画面を事前遮断せず、上流の応答を表示して送信内容を復元する。CAG のコードとプロセスは変更していない。
