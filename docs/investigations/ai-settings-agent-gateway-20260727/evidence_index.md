# 证据索引

| 结论 | 证据 | 可信度 |
| --- | --- | --- |
| 现有模型设置只有一条 provider 唯一记录 | `app/db/migrations/014_create_ai_model_settings.sql` | 高 |
| 现有 API Key 完整回填 | `app/gateway/model-settings-database.mjs` | 高 |
| CAG 任务创建返回 HTTP 202 与 `id` | `D:/workspace/cag/backend/app/api/tasks.py` | 高 |
| CAG 任务 SSE 支持 `after_sequence` 与 `follow` | `D:/workspace/cag/backend/app/api/tasks.py` | 高 |
| CAG 会话 SSE 支持 `Last-Event-ID` | `D:/workspace/cag/backend/app/api/conversations.py` | 高 |
| 网站后端应代理 SSE 且按 sequence 恢复 | `docs/网站层Agent Gateway技术规格书.docx` 第 4、5、13 页 | 高 |
| 浏览器不应持有上游 Secret | `docs/网站层Agent Gateway技术规格书.docx` 第 2、10 页 | 高 |
