# 証拠一覧

| ID | 主張 | 証拠 | 状態 |
| --- | --- | --- | --- |
| E1 | 顧客台帳は物理 ID を使用する | Migration 028、032 | 確認済み |
| E2 | CAG は Citation 付き検索を提供する | CAG 0.22.8 Knowledge Search API | 確認済み |
| E3 | CAG Task は非同期作成できる | Task `bef77c56-d378-417b-bd83-120c57419dd8` | 確認済み |
| E4 | 実検索が API 応答性を阻害する | 45 秒、60 秒 Timeout と Supervisor 再起動記録 | 確認済み |
| E5 | OneOps は失敗を利用者へ表示する | Scan API、正式 Asset、Portal 153 件 | 実装及び静的配信確認済み |
| E6 | 根拠なし候補を拒否する | `customer-knowledge-scan.mjs`、Gateway 192 件 | 確認済み |
| E7 | 候補を物理 ID 台帳へ反映できる | 正式 PostgreSQL 受入 | 契約 1 件、VPN 1 件成功後 Cleanup |
| E8 | 正式 Browser 認証 | `https://192.168.20.54/customers` | HTTP Windows SSO で停止、画面証拠不足 |
