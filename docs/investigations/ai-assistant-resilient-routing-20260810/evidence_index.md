# 証拠索引

| 主張 | 証拠 | 状態 |
| --- | --- | --- |
| 軽量 Task は luna を選択する | `app/gateway/ai-assistant-routing.test.mjs` | 自動試験合格 |
| 複雑 Task は初回から terra を選択する | `app/gateway/ai-assistant-routing.test.mjs` | 自動試験合格 |
| 同一 Fingerprint は 2 回目から terra へ昇格する | `app/gateway/ai-assistant-routing.test.mjs` | 自動試験合格 |
| 後続本文は直前 Task Summary を継続する | `app/gateway/ai-assistant-routing.test.mjs` | 自動試験合格 |
| Contract Error は再試行しない | `app/gateway/agent-gateway-request.test.mjs` | 自動試験合格 |
| 一時障害は予備 CAG へ切り替える | `app/gateway/agent-gateway-request.test.mjs`、`app/gateway/ai-assistant.test.mjs` | 自動試験合格 |
| SSE は Resume 情報を保持する | `app/gateway/agent-gateway-request.test.mjs` | 自動試験合格 |
| CAG Conversation 作成は幂等 Replay できる | `D:/workspace/cag/backend/tests/test_conversations_api.py` | 自動試験合格 |
| CAG は OneOps v3 Routing Payload を保存する | `D:/workspace/cag/backend/tests/test_tasks_api.py` | 自動試験合格 |
| 本番 Browser と故障切替 | リリース後 Screenshot、Console、API 証跡 | 未検証 |
