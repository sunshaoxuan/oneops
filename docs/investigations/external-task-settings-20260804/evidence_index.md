# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| Backlog API は API Key または OAuth 2.0 を使用する | Backlog Developer API 認証資料 | 高 | ログイン画面の内部仕様は対象外 |
| 外部タスクは UPDS と Backlog を別物理レコードで保存する | Migration 027、`inquiry-support-database.mjs` | 高 | Backlog 値は管理者入力前は未登録 |
| 問合 AI は `INQUIRY` Model だけを使用する | `resolveInquiryDefaultModel` と単体試験 | 高 | Model 未設定時は 409 |
| 旧 API Key を新物理 ID で再暗号化する | `ensureInquiryDefault` | 高 | 初回読み込みまたは AI 実行時に実施 |
| 正式 Migration が成功した | PostgreSQL の `api_url` 列と CHECK 制約 | 高 | Migration 026 は並行作業のため公開時に隔離 |
| 正式 UI は 0.9.0 Portal を返す | HTTPS 200 と `index-B_1z8S2T.js` | 高 | ログイン後画面は未確認 |
