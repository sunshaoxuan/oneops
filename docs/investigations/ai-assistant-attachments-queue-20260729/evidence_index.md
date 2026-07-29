# 証拠索引

| 確認事項 | 証拠 | 信頼度 | 結論 |
| --- | --- | --- | --- |
| 稼働中 CAG に汎用アップロード APIがない | `http://127.0.0.1:8000/openapi.json` の path と requestBody | 高 | OneOps から CAG の既存添付 ID を指定する方式は利用できない |
| Task 作成は JSON | OpenAPI の `/api/v1/tasks` | 高 | ブラウザーから multipart を Task API へ直接送らない |
| Task は待機状態を持つ | OpenAPI の Task status と既存 Task 応答 | 高 | UI に実行待ち状態を表示する |
| SSE は独立した購読 API | `/tasks/{id}/events`、`/conversations/{id}/events` | 高 | SSE 接続や待機 Task で入力全体を止めない |
| CAG は Task ごとの分離作業領域を使用する | `D:\workspace\cag\backend\app` の Task Executor と Codex runtime | 高 | OneOps のローカル絶対パスを直接渡さない |
| OneOps 実行領域は Git 対象外 | `D:\nginx\.gitignore` の `/runtime/` | 高 | 添付実体と署名鍵をリポジトリへ含めない |
