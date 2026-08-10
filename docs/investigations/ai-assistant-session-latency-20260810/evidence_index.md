# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| 事故時間帯は CAG 依存サービス停止と配信切替が重なった | `app/logs/continuous-delivery.log`、CAG Gateway Error Log、Container 起動時刻 | 高 | Error Log は Runtime Data のため Git 管理外 |
| DELETE は CAG を呼ばず HTTP 200 を返した | `logs/access.log`、`auth_audit_events`、`ai-assistant-routes.mjs` | 高 | 旧 Access Log に要求時間列がなかった |
| 旧詳細は 30、60、120 秒待機した | `auth_audit_events.duration_ms` | 高 | 本文及び Token は取得していない |
| 過去 Event は 882 件、約 1.22 MiB | CAG Event 読取 Probe | 高 | 会話本文は出力していない |
| Task Summary と最終 Message は一致する | SHA-256 比較 2 件 | 高 | Hash と文字数だけを比較した |
| 変更後は Task 一覧 1 回で復元する | 変更後 Route Probe、Gateway Test、0.18.7 Access Log | 高 | 専用 Test Session で確認済み |
| JSON は 5 秒の総予算を持つ | `agent-gateway-request.mjs`、Timeout Test | 高 | 実障害切替は未実施。専用 Fixture で確認済み |
| 完了済み会話は SSE を開かない | `AiAssistantChat.tsx`、Portal Test、0.18.7 Access Log | 高 | 専用 Test Session と既存完了 Session で確認済み |
| Task SSE 再接続は受信済み sequence を再送しない | `ai-assistant-routes.mjs`、`Last-Event-ID` Route Test | 高 | Browser 切断試験は未実施 |
| 並行 Task の購読は Conversation 所有関係を維持する | CAG Task 詳細照合、所有境界 Test | 高 | 実並行 Task の生成試験は未実施 |
| 削除は即時反映し失敗時に戻す | `AiAssistantChat.tsx`、Portal Test、Browser 64 ms、DELETE 9 ms | 高 | 失敗復元は自動 Test、成功経路は Runtime で確認済み |
| 削除前に一覧と詳細の処理中 Query を取消す | QueryClient 行動 Test | 高 | Browser の競合操作は未実施 |
| CAG Scheduler の空転は停止した | PostgreSQL CPU 1.53%、20秒で `knowledge_sources` 更新差分0件、CAG API CPU 0.062秒 | 高 | 実行中 Ingestion 1件と Lease 1件は変更せず保護した |
| Scheduled Ingestion 作成は Source 単位で直列化する | Source Row Lock、専用 PostgreSQL 双 Transaction Test | 高 | 専用 Test Database は試験後に削除済み |
| PostgreSQL と Redis は異常終了後に自動復旧する | Compose と現行 Container の `unless-stopped`、同一 Image の隔離 Crash Test | 高 | 現行 Container は停止せず、無 Port、無 Volume の一時 Container で両方 `RestartCount=1` と再 Ready を確認 |
| AI画面は Workbench 背景要求を停止する | 60秒以上の Browser 観測、Nginx Access Log | 高 | 認証 Session は権限反映のため10秒周期で維持 |
| Workbench 復帰時は Dashboard、SSE、個人タスク概要を再開する | Browser 遷移、Nginx Access Log | 高 | SSE はAI画面遷移時に終了を確認 |
| 組織機関選択は画面往復で維持する | 物理 ID 実装、Lifecycle Test、Browser 往復 | 高 | 現行 Role は `customer.knowledge.manage` 未割当のため Model API を使用 |
| CAG Ingestion SSE は企業知識画面だけで使用する | CAG DOM、TCP 接続置換、離脱後 Established 0本 | 高 | Audit SSE と Ingestion SSE を区別して記録 |
| CAG SSE は Transaction を残さない | `pg_stat_activity` | 高 | Ingestion SSE 接続中 `idle in transaction=0` |
| 0.18.7 Runtime と Build は同一 | Health、Asset、`index.html` SHA-256 | 高 | SHA-256 完全一致 |
| UI 証拠に個人情報を含めない | `browser-ai-assistant-safe-session-0.18.7.png`、SHA-256 `515431212B480E0C5238E4095AAEF5C3E338C7DDE012F2598982FB5AED38A87F` | 高 | 専用 Prompt と `OK` だけをトリミングして保存 |
