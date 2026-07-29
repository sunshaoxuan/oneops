# 実行コマンド

## AI 履歴件数

PostgreSQL コンテナー内で次を確認した。

```sql
SELECT count(*) FROM inquiry_assist_runs;
SELECT count(*) FROM inquiry_assist_run_events;
SELECT count(*) FROM auth_audit_events
WHERE capability = 'INQUIRY_AI_ASSIST';
```

## AI 履歴削除

```sql
BEGIN;
DELETE FROM inquiry_assist_runs;
COMMIT;
```

削除後に実行履歴 0 件、イベント 0 件、AI 操作監査 313 件を確認した。

## CAG 接続

```powershell
curl.exe -sS http://127.0.0.1:8000/api/v1/projects
curl.exe -sS http://127.0.0.1:8000/openapi.json
```

## CAG SSE

既存の完了 Task に対して `follow=false` で読み取り試験を行った。

```text
GET /api/v1/tasks/{task_id}/events?after_sequence=0&follow=false
GET /api/v1/tasks/{task_id}/events?after_sequence=25&follow=false
GET /api/v1/tasks/{task_id}/events?after_sequence=0&follow=false
Last-Event-ID: 25
```

PowerShell の文字列で `$base?` が変数名として解釈された最初の再開試験は URI エラーになった。`${baseUrl}?` へ修正して再実行した。

## AI アシスタント用 API

ライブ OpenAPI から Conversation と Task の Path を抽出し、次を確認した。

```text
POST /api/v1/conversations
GET /api/v1/conversations/{conversation_id}
GET /api/v1/conversations/{conversation_id}/tasks
GET /api/v1/conversations/{conversation_id}/events
POST /api/v1/tasks
GET /api/v1/tasks/{task_id}
GET /api/v1/tasks/{task_id}/events
```

既存 Task の SSE を読み取り、メッセージイベントのデータ項目を確認した。

```text
agent.message.started.data: item_id, turn_id
agent.message.delta.data: item_id, turn_id, delta, text
agent.message.data: item_id, turn_id, text
```
