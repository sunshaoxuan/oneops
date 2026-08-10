# AI助手 Task Routing 及び CAG 可用性調査報告

## 調査目的

AI助手の軽量作業が過度に重い Model を使用する問題、新規 Session の Task 作成失敗、会話内作業の継続不足及び CAG 障害時の成功率を同一契約で解決する。

## 確認した原因

| 事象 | 原因 | 証拠 | 確度 |
| --- | --- | --- | --- |
| 旧 Session が発言できない | Model Snapshot が空の Session に Session 固定 Routing を要求した | 旧 Session DB 値及び `AI_ASSISTANT_CONFIGURATION_REQUIRED` 応答 | 高 |
| 新規 Session が 502 になる | OneOps Payload に CAG 必須の `routing_context.tier` が存在しない | CAG Pydantic Validation の `routing_context.tier Field required` | 高 |
| 翻訳が terra を使用する | 有効な汎用 Model と全 Shortcut が terra だけを参照し、luna が削除済み | Model 設定 DB、Migration 039、Shortcut 設定 | 高 |
| CAG 障害時に失敗する | OneOps が単一 Endpoint へ一度だけ送信していた | 変更前の AI Assistant Route | 高 |
| Model 供給が実行ごとに変動する | 同じ terra Model が複数存在する状態で監査利用者を無条件の `LIMIT 1` から取得していた | Model 設定 DB、供給 Script の実行 Error | 高 |

## 実装した契約

1. `FAST` の有効 `GENERAL` を軽量 Model とする。
2. 既定の有効 `GENERAL` を汎用 Model とする。
3. 翻訳、要約、分類及び一般支援は軽量 Model から開始する。
4. 問合せ分析、複雑分析及び Agent 操作は汎用 Model から開始する。
5. 同一 Task Fingerprint の 2 回目以降は汎用 Model へ一段階だけ昇格する。
6. 後続入力に新しい作業が明示されない場合は CAG Task Prompt に保存した Task Summary を継続する。
7. Conversation と Task 作成は CAG の Client 単位幂等契約を使用する。
8. 一時障害だけを有限再試行し、Endpoint 単位の Circuit Breaker と同一 Database 及び Queue を共有する予備 Endpoint を使用する。
9. CAG を Conversation、Task、SSE、履歴、継続及び監査の正式データソースとして維持する。
10. terra が複数存在する場合は監査利用者を持つ最新設定を決定的に供給元とする。

## 現時点の制限

自動テスト及び Build は通過した。Model 実設定、`8001` の予備 CAG、同一 PostgreSQL と Redis の共有及び実 Network Failover は検証済みである。OneOps 0.18.1 配信、主 CAG 0.28.1 更新、認証済み Browser、Console 及び Screenshot はリリース工程で検証する。
