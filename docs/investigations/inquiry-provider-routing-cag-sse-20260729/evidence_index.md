# 証跡一覧

| 主張 | 証跡 | 確度 | 制限 |
| --- | --- | --- | --- |
| AI 実行履歴を削除した | PostgreSQL 削除前後件数 | 高 | 操作監査は保持 |
| 既定 Provider は Model API | `inquiry_source_settings` の非機密項目 | 高 | 実行ごとの選択は未実装 |
| OneCAG の Project 接続は成功する | `GET /api/v1/projects` の 200 応答 | 高 | Task 実行成功を保証しない |
| CAG Task SSE はイベントを返す | 完了 Task の 27 SSE イベント | 高 | 既存 Task による読み取り試験 |
| CAG 本文は `data.text` | 実 Task の `agent.message.data` キー | 高 | 0.12.0 主実行サービス |
| CAG delta は `data.delta` | 実 Task の `agent.message.delta.data` キー | 高 | 既存 Task による読み取り試験 |
| OneOps は `data.text` を読まない | `app/gateway/inquiry-analysis.mjs` | 高 | 修正前の現行実装 |
| Task `Last-Event-ID` は未対応 | Header 再開試験と `backend/app/api/tasks.py` | 高 | Conversation SSE は別実装 |
| 主実行サービスとリポジトリに版差がある | OpenAPI 0.12.0、`VERSION` 0.15.0 | 高 | 実行プロセスの Git commit は取得不能 |
| CAG は Conversation 詳細と Task 一覧を提供する | ライブ OpenAPI の Conversation 関連 Path | 高 | ユーザー所有関係は OneOps で管理する |
| ユーザーごとの複数 Session が必要 | `docs/AI_ASSISTANT_REQUIREMENTS.md` | 高 | 実装前の確定要件 |

## ファイル

1. `app/gateway/inquiry-analysis.mjs`
2. `app/gateway/agent-gateway-settings.mjs`
3. `app/gateway/server.mjs`
4. `app/packages/api-client/src/index.ts`
5. `app/gateway/inquiry-support-database.mjs`
6. `app/db/migrations/016_create_inquiry_support.sql`
7. `D:\workspace\cag\backend\app\api\tasks.py`
8. `D:\workspace\cag\backend\app\events\sse.py`
