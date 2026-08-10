# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| 事故時間帯は CAG 依存サービス停止と配信切替が重なった | `app/logs/continuous-delivery.log`、CAG Gateway Error Log、Container 起動時刻 | 高 | Error Log は Runtime Data のため Git 管理外 |
| DELETE は CAG を呼ばず HTTP 200 を返した | `logs/access.log`、`auth_audit_events`、`ai-assistant-routes.mjs` | 高 | 旧 Access Log に要求時間列がなかった |
| 旧詳細は 30、60、120 秒待機した | `auth_audit_events.duration_ms` | 高 | 本文及び Token は取得していない |
| 過去 Event は 882 件、約 1.22 MiB | CAG Event 読取 Probe | 高 | 会話本文は出力していない |
| Task Summary と最終 Message は一致する | SHA-256 比較 2 件 | 高 | Hash と文字数だけを比較した |
| 変更後は Task 一覧 1 回で復元する | 変更後 Route Probe、Gateway Test | 高 | 認証済み Browser は配信後に確認する |
| JSON は 5 秒の総予算を持つ | `agent-gateway-request.mjs`、Timeout Test | 高 | 実障害切替は配信後に確認する |
| 完了済み会話は SSE を開かない | `AiAssistantChat.tsx`、Portal Test | 高 | Browser Network は配信後に確認する |
| Task SSE 再接続は受信済み sequence を再送しない | `ai-assistant-routes.mjs`、`Last-Event-ID` Route Test | 高 | Browser 切断試験は配信後に確認する |
| 並行 Task の購読は Conversation 所有関係を維持する | CAG Task 詳細照合、所有境界 Test | 高 | 実並行 Task は配信後に確認する |
| 削除は即時反映し失敗時に戻す | `AiAssistantChat.tsx`、Portal Test | 高 | Browser 操作は専用 Test Session で確認する |
| 削除前に一覧と詳細の在処理 Query を取消す | QueryClient 行動 Test | 高 | Browser の競合操作は配信後に確認する |
| CAG Scheduler は空転していた | PostgreSQL CPU Sampling、Lease Update、`scheduler.py` | 高 | 修正後 Runtime Sampling は CAG 配信後に確認する |
| Scheduled Ingestion 作成は Source 単位で直列化する | Source Row Lock、専用 PostgreSQL 双 Transaction Test | 高 | 専用 Test Database は試験後に削除済み |
